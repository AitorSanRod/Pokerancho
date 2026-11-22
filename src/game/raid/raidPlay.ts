import type { Rng } from '../core/random'
import { findMon, type GameState } from '../core/state'
import { finalHpFraction, IncursionPhase, type IncursionProgress } from '../incursion/activeIncursion'
import { settleGroupTaps } from '../incursion/tapSettle'
import type { MovePick, TurnOrders } from '../incursion/tapWindow'
import { maxHp } from '../team/stats'
import { RAID_ROTATIONS, type RaidRotation } from './online/protocol'
import { RaidLink, type TabRaid } from './raid'
import { bossHpAtJoin, bossShareTaken, fightProgress, raidSource } from './raidFight'
import { fightDue, startFight } from './raidLobby'
import { carriesRaidMove } from './raidMoves'
import { applyPrize, fightPrize } from './raidPrizes'
import { roomBoss, type RaidPrize } from './raidRoom'
import { cycleEnd } from './raidSchedule'

// La pelea de la pestaña Raids en la partida: sin servidor empieza a su hora y cada ventana de toques se cierra al
// pasar, con lo que el jugador tenga decidido (como una incursión sin servidor); con él, lo decide el servidor. Al
// terminar se cobra la parte del premio que toque; si al acabar el ciclo no se ha recogido, va a Notificaciones.

/** Por dónde va la pelea de la sala; null si aún no ha empezado */
export function raidProgress(tr: TabRaid, now: number): IncursionProgress | null {
  return tr.room.fight ? fightProgress(tr.room.fight, roomBoss(tr.room), now) : null
}

export const raidFinished = (tr: TabRaid, now: number): boolean => raidProgress(tr, now)?.phase === IncursionPhase.Finished

/** Su Pokémon tal y como entra en la pelea ya empezada, si lo ha pedido (sin él, las órdenes no llevan `joins`) */
const joining = (tr: TabRaid) => (tr.pendingJoin ? { joins: tr.room.entrants.filter((e) => e.member.id === tr.uid).map((e) => e.member) } : {})

/** Lo que el jugador lleva decidido para la próxima ventana, como órdenes del turno */
export const raidOrders = (tr: TabRaid): TurnOrders => ({
  ...(tr.pendingTap > 0 ? { taps: { [tr.uid]: tr.pendingTap } } : {}),
  picks: tr.pendingPick ? { [tr.uid]: tr.pendingPick } : {},
  crits: tr.pendingCrit ? [tr.uid] : [],
  ...joining(tr),
})

const clearPending = (tr: TabRaid) => Object.assign(tr, { pendingPick: null, pendingTap: 0, pendingCrit: false, pendingJoin: false })

/** Sin servidor: la pelea empieza a su hora y se cierran las ventanas de toques ya pasadas */
function playLocally(tr: TabRaid, now: number) {
  if (fightDue(tr.room, now)) startFight(tr.room)
  const fight = tr.room.fight
  if (fight && settleGroupTaps(fight, raidSource(roomBoss(tr.room)), now, 0, raidOrders(tr))) clearPending(tr)
}

/** Lo que se lleva al terminar: el premio por la parte del jefe quitada y su Pokémon, con los PS que le queden */
function settle(s: GameState, tr: TabRaid, p: IncursionProgress, rng: Rng): RaidPrize {
  const fight = tr.room.fight!
  const mon = findMon(s, tr.uid)
  // Si no llegó a entrar en la pelea, vuelve como se fue
  if (mon && bossHpAtJoin(fight, p, tr.uid) !== null) mon.hp = Math.round(maxHp(mon) * finalHpFraction(fight, p, tr.uid))
  return fightPrize(roomBoss(tr.room), tr.uid, bossShareTaken(fight, p, tr.uid), rng)
}

/**
 * Pasa el tiempo en las salas de la partida: las locales se juegan y, acabado el ciclo, la pelea terminada que no se
 * ha recogido deja su premio en Notificaciones y el Pokémon vuelve al rancho
 */
export function advanceRaids(s: GameState, now: number, rng: Rng = Math.random) {
  for (const rotation of RAID_ROTATIONS) {
    const tr = s.raids[rotation]
    if (!tr) continue
    if (tr.link === RaidLink.Local) playLocally(tr, now)
    const p = raidProgress(tr, now)
    if (now < cycleEnd(tr.room.cycle) || p?.phase !== IncursionPhase.Finished) continue
    s.raidPrizes.push(settle(s, tr, p, rng))
    s.raids[rotation] = null
  }
}

/** Al ver el final de la pelea: cobra ya su premio y el Pokémon vuelve al rancho. null si aún no ha terminado */
export function collectRaid(s: GameState, rotation: RaidRotation, now: number, rng: Rng = Math.random): RaidPrize | null {
  const tr = s.raids[rotation]
  const p = tr && raidProgress(tr, now)
  if (!tr || p?.phase !== IncursionPhase.Finished) return null
  const prize = settle(s, tr, p, rng)
  applyPrize(s, prize)
  s.raids[rotation] = null
  return prize
}

/** La pelea de esa rotación, si está en marcha y el Pokémon del jugador sigue en ella */
function liveFight(s: GameState, rotation: RaidRotation, now: number): TabRaid | null {
  const tr = s.raids[rotation]
  const phase = tr && raidProgress(tr, now)?.phase
  return tr && phase && phase !== IncursionPhase.Finished ? tr : null
}

/** Elige ataque y objetivo para su Pokémon desde el próximo turno; false si no puede (no lo conoce o ya acabó) */
export function setRaidPick(s: GameState, rotation: RaidRotation, pick: MovePick, now: number): boolean {
  const tr = liveFight(s, rotation, now)
  const mon = tr && findMon(s, tr.uid)
  if (!tr || !mon || !carriesRaidMove(mon, pick.moveId)) return false
  tr.pendingPick = { moveId: pick.moveId, target: pick.target }
  tr.pendingTap = 0
  return true
}

/**
 * Sin servidor: lo que lleva conseguido en el reto de la ventana abierta (de 0 a 1; nunca baja). Con `done` (acabó el
 * reto) o la puntuación entera, la ventana se cierra ya, con lo que tuviera decidido
 */
export function scoreRaidTap(s: GameState, rotation: RaidRotation, score: number, done: boolean, now: number) {
  const tr = liveFight(s, rotation, now)
  const p = tr && raidProgress(tr, now)
  if (!tr || tr.link !== RaidLink.Local || p?.phase !== IncursionPhase.Tap || !p.tap) return
  const turns = tr.room.fight!.orders[0].turns
  if (turns.length !== p.tap.turn) return
  tr.pendingTap = Math.max(tr.pendingTap, Math.min(1, score))
  if (!done && tr.pendingTap < 1) return
  turns.push(raidOrders(tr))
  clearPending(tr)
}

/** Ha acertado el toque crítico en un golpe: el primero del turno siguiente será crítico */
export function markRaidCrit(s: GameState, rotation: RaidRotation, now: number) {
  const tr = liveFight(s, rotation, now)
  if (tr) tr.pendingCrit = true
}

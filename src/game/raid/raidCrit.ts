import { TAP_CRIT_MULT } from '../battle/attack'
import { CRIT_RING_MS, judgeRing, ringKey, ringShown } from '../battle/critTiming'
import type { GameState } from '../core/state'
import { isEnding } from './raidEnding'
import { playerMembers } from './raidEngine'
import { elapsedInRound, replayHits, type ReplayHit } from './raidReplay'
import { BOSS_ID, type Raid } from './raidRoom'

// Toque crítico contra el jefe comunitario (reglas en battle/critTiming.ts): en algunas rondas, el golpe del Pokémon
// del jugador lleva anillo, que se cierra cuando se ve ese golpe. Al acabar de vigilarlo, si fue crítico, el golpe
// hace TAP_CRIT_MULT: en una sala local se le quita al jefe en el acto (y puede tumbarlo); en una del servidor se le
// manda en la siguiente consulta y el servidor pone el daño (online/sharedCrits.ts). El golpe se ve crítico ya en el móvil.

/** Milisegundos de juego tras el golpe en los que otro toque aún lo hace fallar */
export const RAID_CRIT_GUARD_MS = 400

/** Golpe al jefe del Pokémon del jugador en la ronda que se ve; null si no le ha pegado */
export function playerHit(raid: Raid): ReplayHit | null {
  const mine = new Set(playerMembers(raid).map((m) => m.id))
  return replayHits(raid).find((h) => mine.has(h.from) && h.to === BOSS_ID && !h.status && h.dealt > 0) ?? null
}

/** El anillo de la ronda que se ve: solo si el jugador pega y a ese golpe le toca anillo (fijo para el jefe, la ronda y el Pokémon) */
export function raidRing(raid: Raid): ReplayHit | null {
  const hit = playerHit(raid)
  return hit && ringShown(ringKey(raid.boss.speciesId, raid.round, hit.from)) ? hit : null
}

/** Milisegundos de la ronda en la hora real `now` (la sala avanza en el tick; entre ticks, se suma lo que ha pasado) */
export const raidElapsed = (s: GameState, raid: Raid, now: number): number =>
  elapsedInRound(raid) + Math.max(0, now - s.lastTick) * s.timeScale

/** El anillo que se ve en `elapsed` (desde que empieza a cerrarse hasta que se deja de vigilar); null si ninguno */
export function raidRingAt(raid: Raid, elapsed: number): ReplayHit | null {
  const hit = raidRing(raid)
  return hit && elapsed >= hit.at - CRIT_RING_MS && elapsed < hit.at + RAID_CRIT_GUARD_MS ? hit : null
}

/** Toque en plena pelea contra el jefe: se apunta para el anillo de esta ronda. Devuelve si la ronda tiene anillo */
export function tapRaid(s: GameState, raid: Raid, now: number): boolean {
  if (isEnding(raid) || !raidRing(raid)) return false
  if (raid.crit?.round !== raid.round) raid.crit = { round: raid.round, taps: [], settled: false, result: null }
  if (!raid.crit.settled) raid.crit.taps.push(raidElapsed(s, raid, now))
  return true
}

/** Hace crítico el golpe del jugador: el daño de más, en local al jefe (puede tumbarlo) o pendiente de mandar al servidor */
function applyCrit(raid: Raid, hit: ReplayHit) {
  const shown = raid.lastRound.find((h) => h.from === hit.from && h.to === BOSS_ID && !h.status)!
  const bonus = Math.round(hit.dealt * (TAP_CRIT_MULT - 1))
  shown.tapCrit = true
  shown.dealt += bonus
  if (raid.remote?.roomId) {
    raid.remote.pendingCrits = (raid.remote.pendingCrits ?? 0) + 1
    return
  }
  const taken = Math.min(bonus, raid.hp)
  raid.hp -= taken
  const member = raid.members.find((m) => m.id === hit.from)
  if (member) member.damage += taken
}

/** Ya pasado el golpe, decide el crítico de la ronda que se ve (antes de que el tick juegue la siguiente) */
export function settleRaidCrit(s: GameState, raid: Raid, now: number) {
  const crit = raid.crit
  const hit = raidRing(raid)
  if (!crit || crit.settled || crit.round !== raid.round || !hit || isEnding(raid)) return
  if (raidElapsed(s, raid, now) < hit.at + RAID_CRIT_GUARD_MS) return
  crit.settled = true
  crit.result = judgeRing(hit.at, hit.at + RAID_CRIT_GUARD_MS, crit.taps)
  if (crit.result === 'crit') applyCrit(raid, hit)
}

import { incursion, type IncursionId } from '../../data/incursions'
import { species } from '../../data/species'
import { boostedMoney } from '../battle/rewards'
import { markSeen } from '../collection/dex'
import { addPieces } from '../collection/pieces'
import type { Rng } from '../core/random'
import { findMon, MonPlace, monPlace, type GameState } from '../core/state'
import { gainExp, maxHp } from '../team/stats'
import { finalHpFraction, incursionProgress, IncursionPhase, regroupEnd, startNextLeg, type ActiveIncursion } from './activeIncursion'
import { entryBlock, EntryBlock } from './entry'
import type { Earned } from './incursionRewards'
import { keysOf, spendKey } from './keys'
import { fillWithBots, freshMember } from './party'
import { canLearn } from './repertoire'
import { retreatPasses } from './retreatVote'
import { pendingOrders } from './incursionPicks'
import { settleTaps } from './tapSettle'

// La incursión en la partida, sin servidor: el grupo se completa con bots al entrar y los tramos siguen solos con la
// hora. Las salas de reorganizar duran REGROUP_MS o hasta que el jugador sigue; cada ventana de toques se cierra al
// pasar su hora, con el ataque potenciado si el jugador llegó a los toques.

/** Por qué no puede entrar ese Pokémon con ese movimiento (null si puede) */
export function incursionBlocker(s: GameState, id: IncursionId, uid: string, moveId: string): string | null {
  const mon = findMon(s, uid)
  if (!mon) return 'Ese Pokémon no existe.'
  const inc = incursion(id)
  if (s.incursion) return 'Ya estás en una incursión.'
  if (s.incursionQueue) return 'Ya estás buscando grupo.'
  if (keysOf(s, id) < 1) return 'Necesitas una llave de esta incursión. Se compran en la Tienda.'
  if (monPlace(s, uid) !== MonPlace.Ranch) return 'Tiene que estar en el rancho.'
  const block = entryBlock(inc, mon.level)
  if (block === EntryBlock.TooLow) return `Hace falta Nv. ${inc.minLevel} para entrar.`
  if (block === EntryBlock.TooHigh) return `No pueden entrar Pokémon de más de Nv. ${inc.maxLevel}.`
  if (mon.hp < 1) return `${species(mon.speciesId).name} está debilitado.`
  if (!canLearn(mon.speciesId, mon.level, moveId)) return 'No conoce ese movimiento.'
  return null
}

const newSeed = (rng: Rng) => Math.floor(rng() * 2 ** 31)

/** Entra en la incursión: gasta la llave, completa el grupo con bots y empieza el primer tramo */
export function startIncursion(s: GameState, id: IncursionId, uid: string, moveId: string, now: number, rng: Rng = Math.random) {
  if (incursionBlocker(s, id, uid, moveId)) return
  const mon = findMon(s, uid)!
  spendKey(s, id)
  const player = { ...freshMember({ id: uid, speciesId: mon.speciesId, level: mon.level, stars: mon.stars, moveId }), hpFraction: mon.hp / maxHp(mon) }
  s.incursion = {
    incursionId: id,
    uid,
    members: fillWithBots(incursion(id), [player], rng),
    orders: [{ seed: newSeed(rng), moves: {}, turns: [] }],
    legStarts: [now],
    nextMove: null,
    pendingPick: null,
    retreat: null,
    online: null,
  }
}

/** Sin servidor: empieza el tramo siguiente a la hora `at`, con el movimiento elegido al reorganizar */
function nextLeg(a: ActiveIncursion, at: number) {
  startNextLeg(a, at, a.nextMove ? { [a.uid]: a.nextMove } : {})
  a.nextMove = null
}

/**
 * Con el tiempo: se cierran las ventanas de toques ya pasadas y, al acabar el plazo de una sala de reorganizar, empieza
 * el tramo siguiente (aunque la app estuviera cerrada). Con otros jugadores lo decide el servidor
 */
export function advanceIncursion(s: GameState, now: number) {
  const a = s.incursion
  if (!a || a.online) return
  for (;;) {
    if (settleTaps(a, now, 0, pendingOrders(a, false))) a.pendingPick = null
    const p = incursionProgress(a, now)
    if (p.phase !== IncursionPhase.Regroup || p.regroupMsLeft > 0) return
    nextLeg(a, regroupEnd(a, p))
  }
}

/**
 * Sin servidor: el jugador ha llegado a los toques en la ventana abierta y su Pokémon pega más este turno (la ventana
 * se cierra ya, con el cambio de ataque que tuviera pendiente)
 */
export function boostIncursionTap(s: GameState, now: number) {
  const a = s.incursion
  if (!a || a.online) return
  const p = incursionProgress(a, now)
  const turns = a.orders[p.leg].turns
  if (p.phase !== IncursionPhase.Tap || !p.tap || turns.length !== p.tap.turn) return
  turns.push(pendingOrders(a, true))
  a.pendingPick = null
}

/** En la sala de reorganizar: elige el movimiento para el tramo siguiente */
export function chooseIncursionMove(s: GameState, moveId: string, now: number) {
  const a = s.incursion
  const mon = a && findMon(s, a.uid)
  if (!a || !mon || incursionProgress(a, now).phase !== IncursionPhase.Regroup) return
  if (canLearn(mon.speciesId, mon.level, moveId)) a.nextMove = moveId
}

/** En la sala de reorganizar: sigue ya, sin esperar al plazo (sin servidor, el único jugador es él; con él, se avisa al servidor) */
export function continueIncursion(s: GameState, now: number) {
  const a = s.incursion
  if (a && !a.online && incursionProgress(a, now).phase === IncursionPhase.Regroup) nextLeg(a, now)
}

/**
 * Vota retirarse; sin servidor su voto basta: la incursión acaba en este momento y se cobra lo ganado hasta aquí. Con
 * otros jugadores, el voto va al servidor
 */
export function retreatIncursion(s: GameState, now: number) {
  const a = s.incursion
  if (!a || a.online || !retreatPasses(1, 1)) return
  const p = incursionProgress(a, now)
  if (p.phase === IncursionPhase.Finished) return
  a.retreat = { leg: p.leg, atMs: p.legMs }
}

/** Al terminar: cobra lo ganado, el Pokémon vuelve al rancho con los PS que le queden y se cierra la incursión */
export function collectIncursion(s: GameState, now: number): Earned | null {
  const a = s.incursion
  if (!a) return null
  const p = incursionProgress(a, now)
  if (p.phase !== IncursionPhase.Finished) return null
  const { earned } = p.record
  s.money += boostedMoney(earned.money)
  s.tickets += earned.tickets
  for (const [id, n] of Object.entries(earned.pieces)) {
    markSeen(s, Number(id))
    addPieces(s, Number(id), n)
  }
  const mon = findMon(s, a.uid)
  if (mon) {
    mon.hp = Math.round(maxHp(mon) * finalHpFraction(a, p, a.uid))
    gainExp(mon, earned.exp)
  }
  s.incursion = null
  return earned
}

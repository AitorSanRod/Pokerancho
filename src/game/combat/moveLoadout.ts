import { incursionMove, moveClass, MoveClass, type IncursionMove } from '../../data/incursionMoves'
import { findMon, MonPlace, monPlace, type GameState, type OwnedMon } from '../core/state'
import { learnTimeline } from '../incursion/repertoire'
import {
  futureIncursionMoves,
  INCURSION_MOVE_SLOTS,
  incursionMoveChoices,
  incursionMovePool,
} from '../incursion/incursionLoadout'
import { combatLearnTimeline, ROUTE_MOVE_SLOTS, routeMoveChoices, routeMovePool } from './combatRepertoire'

// Los ataques que lleva cada Pokémon, elegidos en la ficha (la «i» de sus ataques): ROUTE_MOVE_SLOTS para las rutas, la
// torre y las raids, e INCURSION_MOVE_SLOTS para las incursiones. Mientras no se toca una sección, la rellena el juego (y
// se pone al día al subir de nivel); al cambiar un hueco, la sección entera queda como la deja el jugador. Solo se
// cambian con el Pokémon en el rancho o en la Caja, o en la sala del checkin de una incursión programada.

export const MoveSection = { Route: 'route', Incursion: 'incursion' } as const
export type MoveSection = (typeof MoveSection)[keyof typeof MoveSection]

/** Huecos de cada sección */
export const SECTION_SLOTS: Record<MoveSection, number> = { [MoveSection.Route]: ROUTE_MOVE_SLOTS, [MoveSection.Incursion]: INCURSION_MOVE_SLOTS }

type Mon = Pick<OwnedMon, 'speciesId' | 'level' | 'tmMoves' | 'routeMoves' | 'incursionMoves'>

/** Los que lleva en esa sección, en el orden de sus huecos */
export const equippedMoves = (mon: Mon, section: MoveSection): IncursionMove[] =>
  section === MoveSection.Route ? routeMoveChoices(mon) : incursionMoveChoices(mon)

const poolOf = (mon: Mon, section: MoveSection): IncursionMove[] => (section === MoveSection.Route ? routeMovePool(mon) : incursionMovePool(mon))

const futureOf = (mon: Mon, section: MoveSection): { move: IncursionMove; level: number }[] =>
  section === MoveSection.Route
    ? combatLearnTimeline(mon.speciesId)
        .filter((step) => step.from > mon.level && moveClass(step.move) === MoveClass.Damage)
        .map((step) => ({ move: step.move, level: step.from }))
    : futureIncursionMoves(mon)

/** Lo que se ve al tocar un hueco: los que puede poner, los ya puestos en otro hueco y los que aprenderá */
export interface SlotOptions {
  open: IncursionMove[]
  equipped: IncursionMove[]
  later: { move: IncursionMove; level: number }[]
}

export function slotOptions(mon: Mon, section: MoveSection): SlotOptions {
  const equipped = equippedMoves(mon, section)
  const pool = poolOf(mon, section)
  const open = pool.filter((mv) => !equipped.some((e) => e.id === mv.id))
  const known = (id: string) => pool.some((mv) => mv.id === id) || equipped.some((mv) => mv.id === id)
  return { open, equipped, later: futureOf(mon, section).filter((f) => !known(f.move.id)) }
}

/** Desde qué nivel lo sabe en esa sección; null si lo sabe por una MT */
export function learnedFrom(speciesId: number, section: MoveSection, moveId: string): number | null {
  const steps = section === MoveSection.Route ? combatLearnTimeline(speciesId) : [...learnTimeline(speciesId), ...combatLearnTimeline(speciesId)]
  const levels = steps.filter((step) => step.move.id === moveId).map((step) => step.from)
  return levels.length > 0 ? Math.min(...levels) : null
}

/** Todo lo que puede llegar a llevar una especie en esa sección (sin MTs), con el nivel desde el que lo sabe (Pokédex) */
export function speciesMoveList(speciesId: number, section: MoveSection): { move: IncursionMove; level: number }[] {
  const route = combatLearnTimeline(speciesId).filter((step) => moveClass(step.move) === MoveClass.Damage)
  const steps = section === MoveSection.Route ? route : [...learnTimeline(speciesId), ...combatLearnTimeline(speciesId)]
  const all = steps.map((step) => ({ move: section === MoveSection.Route ? step.move : incursionMove(step.move.id), level: step.from }))
  all.sort((a, b) => a.level - b.level)
  return all.filter((m, i) => all.findIndex((o) => o.move.id === m.move.id) === i)
}

/** Por qué no se pueden cambiar sus ataques ahora; null si se puede */
export function loadoutBlocker(s: GameState, uid: string): string | null {
  const place = monPlace(s, uid)
  if (place === MonPlace.Ranch || place === MonPlace.Box) return null
  if (place === MonPlace.Incursion && s.incursion?.uid !== uid) return null
  return 'Está fuera: sus ataques se cambian cuando vuelva.'
}

/** El ataque con el que entra en la incursión programada, ya fijado en el servidor: su hueco no se cambia */
export const lockedCheckinMove = (s: GameState, uid: string): string | null =>
  s.incursionCheckin?.uid === uid && s.incursionCheckin.locked ? s.incursionCheckin.moveId : null

/** Pone ese ataque en ese hueco (o en el primero libre); false si no se puede */
export function equipMove(s: GameState, uid: string, section: MoveSection, slot: number, moveId: string): boolean {
  const mon = findMon(s, uid)
  if (!mon || loadoutBlocker(s, uid)) return false
  const current = equippedMoves(mon, section).map((mv) => mv.id)
  if (slot < 0 || slot >= SECTION_SLOTS[section] || slot > current.length) return false
  if (!slotOptions(mon, section).open.some((mv) => mv.id === moveId)) return false
  const forIncursion = section === MoveSection.Incursion
  if (forIncursion && current[slot] !== undefined && current[slot] === lockedCheckinMove(s, uid)) return false
  const next = [...current]
  next[slot] = moveId
  if (forIncursion) mon.incursionMoves = next
  else mon.routeMoves = next
  if (forIncursion) keepCheckinMove(s, uid, next)
  return true
}

/** El ataque marcado en el checkin tiene que ser de los que lleva: si lo quitó, el primero */
function keepCheckinMove(s: GameState, uid: string, moves: string[]) {
  const c = s.incursionCheckin
  if (c?.uid === uid && c.moveId && !moves.includes(c.moveId)) c.moveId = moves[0] ?? null
}

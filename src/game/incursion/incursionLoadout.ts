import { incursionMove, type IncursionMove } from '../../data/incursionMoves'
import { combatLearnTimeline, combatMoveChoices, combatRepertoire } from '../combat/combatRepertoire'
import type { OwnedMon } from '../core/state'
import { learnTimeline, monRepertoire, repertoire } from './repertoire'
import { mayKnow } from './tms'

// Los ataques que lleva un Pokémon del jugador a una incursión: INCURSION_MOVE_SLOTS, elegidos en la ficha (o antes de
// entrar) entre todo lo que sabe ahora, de incursión y de ruta (los de ruta, con los datos de incursión). Sin elegir, los
// pone el juego: su repertorio de incursión en su orden y, si queda hueco, los que ya superó al subir de nivel.

/** Ataques que lleva a una incursión, y los que se ven en la barra de la pelea */
export const INCURSION_MOVE_SLOTS = 4

type Mon = Pick<OwnedMon, 'speciesId' | 'level' | 'tmMoves'> & Partial<Pick<OwnedMon, 'incursionMoves'>>

const unique = (moves: IncursionMove[]) => moves.filter((mv, i) => moves.findIndex((other) => other.id === mv.id) === i)

/** Los que puede elegir a mano: su repertorio de incursión de ahora (con MTs) y todos sus ataques de ruta */
export const incursionMovePool = (mon: Mon): IncursionMove[] =>
  unique([...monRepertoire(mon), ...combatMoveChoices(mon).map((mv) => incursionMove(mv.id))])

/** Los de su repertorio de incursión que ya dejó atrás al subir de nivel (el escalón de daño anterior), el último antes */
export const outgrownMoves = (mon: Pick<OwnedMon, 'speciesId' | 'level'>): IncursionMove[] =>
  learnTimeline(mon.speciesId)
    .filter((step) => step.until !== null && step.until < mon.level)
    .reverse()
    .map((step) => step.move)

/** Los que pone el juego sin elegir: su repertorio en su orden y, si queda hueco, los que ya superó */
export const autoIncursionMoves = (mon: Mon): IncursionMove[] =>
  unique([...monRepertoire(mon), ...outgrownMoves(mon)]).slice(0, INCURSION_MOVE_SLOTS)

/** Lo que puede llevar aunque ya no salga para elegir: lo que puede elegir y lo que superó (si lo eligió antes, lo conserva) */
const carriable = (mon: Mon): IncursionMove[] => unique([...incursionMovePool(mon), ...outgrownMoves(mon)])

/** Los que lleva a las incursiones: los elegidos (los que aún puede llevar) o, sin elegir, los del juego */
export function incursionMoveChoices(mon: Mon): IncursionMove[] {
  if (!mon.incursionMoves) return autoIncursionMoves(mon)
  const can = carriable(mon)
  return mon.incursionMoves.flatMap((id) => can.filter((mv) => mv.id === id)).slice(0, INCURSION_MOVE_SLOTS)
}

/** Lo lleva a las incursiones (lo puede usar al entrar y en plena pelea) */
export const carriesIncursionMove = (mon: Mon, moveId: string): boolean => incursionMoveChoices(mon).some((mv) => mv.id === moveId)

/**
 * Si un Pokémon de esa especie y nivel puede llevar ese ataque a una incursión: de su repertorio (también lo superado), de
 * sus ataques de ruta o de una MT. Para el servidor, que no ve lo elegido ni las MTs (como con su nivel, se fía de la partida)
 */
export const mayCarryIncursionMove = (speciesId: number, level: number, moveId: string): boolean =>
  mayKnow(speciesId, level, moveId) ||
  learnTimeline(speciesId).some((step) => step.from <= level && step.move.id === moveId) ||
  combatRepertoire(speciesId, level).some((mv) => mv.id === moveId)

/** Lo que aprenderá más adelante (para la lista de bloqueados), de incursión y de ruta, por orden de nivel */
export function futureIncursionMoves(mon: Pick<OwnedMon, 'speciesId' | 'level'>): { move: IncursionMove; level: number }[] {
  const known = new Set([...repertoire(mon.speciesId, mon.level), ...combatRepertoire(mon.speciesId, mon.level)].map((mv) => mv.id))
  const steps = [...learnTimeline(mon.speciesId), ...combatLearnTimeline(mon.speciesId)]
  const later = steps
    .filter((step) => step.from > mon.level && !known.has(step.move.id))
    .sort((a, b) => a.from - b.from)
    .map((step) => ({ move: incursionMove(step.move.id), level: step.from }))
  return later.filter((f, i) => later.findIndex((o) => o.move.id === f.move.id) === i)
}

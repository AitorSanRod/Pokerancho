import type { IncursionMove } from '../../data/incursionMoves'
import { signatureMove, type Move } from '../../data/moves'
import { routeMoveChoices } from '../combat/combatRepertoire'
import type { OwnedMon } from '../core/state'

// El ataque de la torre infinita y de las rutas (run/runMove.ts): se elige al empezar y se cambia cuando se quiera, entre
// los ataques de combate del Pokémon (combat/combatRepertoire.ts), con sus efectos y su prioridad.

/** Los ataques que puede elegir en la torre y en las rutas: como mucho ROUTE_MOVE_SLOTS (ver combatRepertoire.ts) */
export const towerMoveChoices = (mon: OwnedMon): IncursionMove[] => routeMoveChoices(mon)

/** Sabe ese ataque y lo puede llevar en la torre */
export const knowsTowerMove = (mon: OwnedMon, moveId: string): boolean => towerMoveChoices(mon).some((m) => m.id === moveId)

/** Un ataque de incursión como ataque de un rival de ruta (entrenadores y líderes): solo su tipo, potencia y precisión */
export const strikeOf = (mv: IncursionMove): Move => ({ id: mv.id, name: mv.name, type: mv.type, power: mv.power, accuracy: mv.accuracy })

/** Un ataque de combate como ataque del Pokémon del jugador: con su prioridad y sus efectos */
export const combatStrike = (mv: IncursionMove): Move => ({ ...strikeOf(mv), priority: mv.priority, effects: mv.effects })

/**
 * El ataque elegido como ataque de combate. Si ya no lo lleva (al subir de nivel aprendió otro que lo dejó fuera de los
 * que caben), el primero de los que lleva; sin ninguno, el suyo de siempre
 */
export function towerMove(mon: OwnedMon, moveId: string): Move {
  const choices = towerMoveChoices(mon)
  const mv = choices.find((m) => m.id === moveId) ?? choices[0]
  return mv ? combatStrike(mv) : signatureMove(mon.speciesId)
}

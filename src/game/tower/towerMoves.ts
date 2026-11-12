import { moveClass, MoveClass, type IncursionMove } from '../../data/incursionMoves'
import { signatureMove, type Move } from '../../data/moves'
import type { OwnedMon } from '../core/state'
import { monRepertoire } from '../incursion/repertoire'

// El ataque de la torre infinita: se elige al empezar y cada pocos pisos entre los de daño del repertorio de
// incursión del Pokémon (por nivel y MT). En la torre solo cuentan su tipo, su potencia y su precisión: sus efectos no.

/** Cada cuántos pisos se vuelve a elegir el ataque (antes de los pisos 1, 1 + esto…) */
export const TOWER_MOVE_PICK_EVERY = 10

/** Los ataques que puede elegir en la torre: los de daño de su repertorio */
export const towerMoveChoices = (mon: OwnedMon): IncursionMove[] => monRepertoire(mon).filter((mv) => moveClass(mv) === MoveClass.Damage)

/** El ataque elegido como ataque de combate; si ya no lo sabe, el suyo de siempre */
export function towerMove(mon: OwnedMon, moveId: string): Move {
  const mv = towerMoveChoices(mon).find((m) => m.id === moveId)
  return mv ? { id: mv.id, name: mv.name, type: mv.type, power: mv.power, accuracy: mv.accuracy } : signatureMove(mon.speciesId)
}

/** Antes de este piso toca elegir ataque */
export const isMovePickFloor = (floor: number): boolean => (floor - 1) % TOWER_MOVE_PICK_EVERY === 0

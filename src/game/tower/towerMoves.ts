import { moveClass, MoveClass, type IncursionMove } from '../../data/incursionMoves'
import { signatureMove, type Move } from '../../data/moves'
import type { OwnedMon } from '../core/state'
import { monRepertoire } from '../incursion/repertoire'

// El ataque de la torre infinita y de las rutas (run/runMove.ts): se elige al empezar y se cambia cuando se quiera, entre
// los de daño del repertorio de incursión del Pokémon (por nivel y MT). Solo cuentan su tipo, su potencia y su
// precisión: sus efectos no.

/** Los ataques que puede elegir en la torre: los de daño de su repertorio */
export const towerMoveChoices = (mon: OwnedMon): IncursionMove[] => monRepertoire(mon).filter((mv) => moveClass(mv) === MoveClass.Damage)

/** Sabe ese ataque y lo puede llevar en la torre */
export const knowsTowerMove = (mon: OwnedMon, moveId: string): boolean => towerMoveChoices(mon).some((m) => m.id === moveId)

/** Un ataque de incursión como ataque de combate de ruta: solo su tipo, su potencia y su precisión */
export const strikeOf = (mv: IncursionMove): Move => ({ id: mv.id, name: mv.name, type: mv.type, power: mv.power, accuracy: mv.accuracy })

/** El ataque elegido como ataque de combate; si ya no lo sabe, el suyo de siempre */
export function towerMove(mon: OwnedMon, moveId: string): Move {
  const mv = towerMoveChoices(mon).find((m) => m.id === moveId)
  return mv ? strikeOf(mv) : signatureMove(mon.speciesId)
}

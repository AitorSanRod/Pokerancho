import { incursionMove, type IncursionMove } from '../incursionMoves'
import { COMBAT_TUNING } from './tuning'

export { COMBAT_LADDERS, LADDER_LEVELS, type CombatStep } from './ladders'
export { COMBAT_MOVESETS, COMBAT_SPECIES_MOVES } from './speciesMoves'
export { COMBAT_TUNING, type MoveTuning } from './tuning'

/**
 * De qué lista sale el ataque de un Pokémon en la pelea de grupo: la de las incursiones (también los bots y los jefes) o
 * la de combate (los Pokémon de los jugadores en las raids, como en las rutas y la torre)
 */
export const MoveBook = { Incursion: 'incursion', Combat: 'combat' } as const
export type MoveBook = (typeof MoveBook)[keyof typeof MoveBook]

/** El ataque de incursión con los ajustes de combate (si los tiene) */
export function combatMove(id: string): IncursionMove {
  const base = incursionMove(id)
  const tuning = COMBAT_TUNING[id]
  return tuning ? { ...base, ...tuning } : base
}

/** El ataque de ese id en esa lista */
export const bookMove = (book: MoveBook | undefined, id: string): IncursionMove => (book === MoveBook.Combat ? combatMove(id) : incursionMove(id))

import type { LearnedMove } from '../learnsets'

// Ataques de combate (rutas, torre y raids) propios de una especie o una forma, por su id de `POKEMON` o `POKEMON_FORM`.
// Las incursiones tienen los suyos aparte (data/learnsets.ts). Solo ataques de daño: los demás no se pueden elegir. Para
// editar a mano, p. ej. `[POKEMON.Pikachu]: [{ move: IMOVE.VoltioCruel, level: 30 }]`. En rutas y torre, donde lleva solo
// unos pocos (game/combat/combatRepertoire.ts › ROUTE_MOVE_SLOTS), los de aquí van por delante de los de su escalera.

/** Además de la escalera de sus tipos (ladders.ts), cada uno desde su nivel */
export const COMBAT_SPECIES_MOVES: Partial<Record<number, LearnedMove[]>> = {}

/** En lugar de la escalera de sus tipos y de COMBAT_SPECIES_MOVES: exactamente estos, cada uno desde su nivel */
export const COMBAT_MOVESETS: Partial<Record<number, LearnedMove[]>> = {}

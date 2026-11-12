import { baseSpeciesOf, species } from '../../data/species'
import type { PokeType } from '../../data/types'
import type { GameState } from '../core/state'
import { MAX_STARS } from './stats'

// Hitos: lo que un Pokémon consigue para sí al subir de nivel y para los de sus tipos al llegar a 5 ★.

/** Niveles que, al alcanzarlos, suben las stats de ese Pokémon */
export const LEVEL_MILESTONES = [25, 50, 75, 100]
/** Fracción que suma a todas sus stats cada hito de nivel alcanzado (0,05 = +5 %) */
export const MILESTONE_STAT_BONUS = 0.05
/** Fracción que suma a las stats de todos los Pokémon de sus tipos cada especie distinta con 5 ★ */
export const STAR_TYPE_BONUS = 0.01
/** Lo más que suma, por tipo, el bono de las especies con 5 ★ */
export const STAR_TYPE_BONUS_MAX = 0.1

/** Hitos de nivel que ya ha alcanzado */
export const reachedMilestones = (level: number): number[] => LEVEL_MILESTONES.filter((l) => level >= l)

/** Fracción de stats que le dan sus hitos de nivel */
export const levelMilestoneBonus = (level: number): number => reachedMilestones(level).length * MILESTONE_STAT_BONUS

/** Especies (sin contar las formas aparte) de las que el jugador tiene un Pokémon con 5 ★ */
export function fiveStarSpecies(s: GameState): number[] {
  const ids = s.owned.filter((m) => m.stars >= MAX_STARS).map((m) => baseSpeciesOf(m.speciesId))
  return [...new Set(ids)]
}

/** Bono de stats de cada tipo por las especies con 5 ★ (con su tope); sin entrada, ninguno */
export function starTypeBonuses(s: GameState): Partial<Record<PokeType, number>> {
  const out: Partial<Record<PokeType, number>> = {}
  for (const id of fiveStarSpecies(s)) {
    for (const t of species(id).types) out[t] = Math.min(STAR_TYPE_BONUS_MAX, (out[t] ?? 0) + STAR_TYPE_BONUS)
  }
  return out
}

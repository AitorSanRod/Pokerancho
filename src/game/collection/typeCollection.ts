import { SPECIES } from '../../data/species'
import { TYPE_INFO, type PokeType } from '../../data/types'
import type { GameState } from '../core/state'

// Colección por tipo: cuantas más especies de un tipo se han capturado, más daño hacen los ataques de ese tipo.

/** Cortes de la colección de un tipo: con esa fracción de sus especies capturadas, sus ataques hacen ese daño de más */
export const COLLECTION_TIERS: readonly { share: number; damage: number }[] = [
  { share: 0.1, damage: 0.01 },
  { share: 0.25, damage: 0.025 },
  { share: 0.5, damage: 0.05 },
  { share: 1, damage: 0.1 },
]

export interface TypeCollection {
  type: PokeType
  caught: number
  total: number
  /** Daño de más de los ataques de ese tipo (0,05 = +5 %) */
  damage: number
  /** Siguiente corte por alcanzar; null si ya tiene el último */
  next: { share: number; damage: number } | null
}

export const ALL_TYPES = Object.keys(TYPE_INFO) as PokeType[]

/** Mejor corte alcanzado con esa fracción capturada (0 si ninguno) */
export const tierDamage = (share: number): number =>
  COLLECTION_TIERS.filter((t) => share >= t.share).reduce((best, t) => Math.max(best, t.damage), 0)

/** Colección de un tipo: sus especies (de todas las Pokédex) capturadas, el daño que da y el siguiente corte */
export function typeCollection(s: GameState, type: PokeType): TypeCollection {
  const ofType = SPECIES.filter((sp) => sp.types.includes(type))
  const caught = ofType.filter((sp) => s.caught.includes(sp.id)).length
  const share = ofType.length ? caught / ofType.length : 0
  return { type, caught, total: ofType.length, damage: tierDamage(share), next: COLLECTION_TIERS.find((t) => share < t.share) ?? null }
}

/** Daño de más de cada tipo de ataque por la colección; sin entrada, ninguno */
export function collectionDamage(s: GameState): Partial<Record<PokeType, number>> {
  const out: Partial<Record<PokeType, number>> = {}
  for (const t of ALL_TYPES) {
    const { damage } = typeCollection(s, t)
    if (damage > 0) out[t] = damage
  }
  return out
}

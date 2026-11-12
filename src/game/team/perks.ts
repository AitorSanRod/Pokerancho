import { species } from '../../data/species'
import type { PokeType } from '../../data/types'
import { ALL_TYPES, COLLECTION_TIERS, collectionDamage } from '../collection/typeCollection'
import type { GameState, OwnedMon } from '../core/state'
import { LEVEL_MILESTONES, MILESTONE_STAT_BONUS, levelMilestoneBonus, STAR_TYPE_BONUS_MAX, starTypeBonuses } from './milestones'

// Lo que un Pokémon del jugador lleva a cualquier combate (ruta, raids, incursiones) por sus hitos y la colección.
// Viaja con él al servidor, que lo comprueba con `parsePerks`.

export interface MonPerks {
  /** Fracción que suma a todas sus stats: sus hitos de nivel y las especies con 5 ★ de sus tipos */
  stats: number
  /** Daño de más de sus ataques según el tipo del ataque (colección por tipo) */
  damage: Partial<Record<PokeType, number>>
}

export const noPerks = (): MonPerks => ({ stats: 0, damage: {} })

/** Bono de stats por las especies con 5 ★ de sus tipos (se suman los de sus dos tipos) */
export function starBonusFor(s: GameState, speciesId: number): number {
  const byType = starTypeBonuses(s)
  return species(speciesId).types.reduce((sum, t) => sum + (byType[t] ?? 0), 0)
}

export const monPerks = (s: GameState, mon: OwnedMon): MonPerks => ({
  stats: levelMilestoneBonus(mon.level) + starBonusFor(s, mon.speciesId),
  damage: collectionDamage(s),
})

/** Multiplicador del daño de un ataque de ese tipo */
export const perkDamageMult = (perks: MonPerks | undefined, type: PokeType): number => 1 + (perks?.damage[type] ?? 0)

/** Lo más que pueden sumar: todos los hitos de nivel y el tope de 5 ★ en dos tipos */
const MAX_STAT_PERK = LEVEL_MILESTONES.length * MILESTONE_STAT_BONUS + 2 * STAR_TYPE_BONUS_MAX + 1e-9
const MAX_DAMAGE_PERK = Math.max(...COLLECTION_TIERS.map((t) => t.damage)) + 1e-9

const inRange = (v: unknown, max: number): v is number => typeof v === 'number' && v >= 0 && v <= max

/** Lo que manda un móvil, comprobado; sin él (clientes de antes), ninguno; null si no encaja */
export function parsePerks(v: unknown): MonPerks | null {
  if (v === undefined) return noPerks()
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return null
  const { stats, damage } = v as Record<string, unknown>
  if (!inRange(stats, MAX_STAT_PERK) || typeof damage !== 'object' || damage === null || Array.isArray(damage)) return null
  const out: MonPerks = { stats, damage: {} }
  for (const [type, value] of Object.entries(damage)) {
    if (!ALL_TYPES.includes(type as PokeType) || !inRange(value, MAX_DAMAGE_PERK)) return null
    out.damage[type as PokeType] = value
  }
  return out
}

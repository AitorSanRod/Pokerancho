import { PASSIVE_THRESHOLDS, type PassiveLevel, type PassiveRef } from '../../data/passives'
import { RANCH_TYPE_THRESHOLD_DISCOUNT, RANCH_TYPES } from '../../data/ranchTypes'
import { RARITY_INFO, rarityOf, species } from '../../data/species'
import type { PokeType } from '../../data/types'
import type { GameState } from '../core/state'

/** Cuánto suma la especie a cada uno de sus tipos para las pasivas, según su rareza (`RARITY_INFO.passiveWeight`) */
export const passiveWeightOf = (speciesId: number): number => RARITY_INFO[rarityOf(species(speciesId))].passiveWeight

/** Peso de cada tipo entre estos Pokémon: cada uno suma el de su rareza a sus tipos (los de dos tipos, en ambos) */
export function typeWeights(speciesIds: number[]): Partial<Record<PokeType, number>> {
  const weights: Partial<Record<PokeType, number>> = {}
  for (const id of speciesIds) for (const t of species(id).types) weights[t] = (weights[t] ?? 0) + passiveWeightOf(id)
  return weights
}

/** Nivel de pasiva que da ese peso (0: ninguno); `discount` rebaja todos los umbrales */
export function passiveLevel(weight: number, discount = 0): PassiveLevel | 0 {
  return PASSIVE_THRESHOLDS.filter((t) => weight >= t - discount).length as PassiveLevel | 0
}

/** Pasivas que dan esos pesos: por cada tipo, el nivel alcanzado */
export function passivesFrom(weights: Partial<Record<PokeType, number>>, discountOf: (t: PokeType) => number = () => 0): PassiveRef[] {
  return (Object.entries(weights) as [PokeType, number][]).flatMap(([type, weight]): PassiveRef[] => {
    const level = passiveLevel(weight, discountOf(type))
    return level === 0 ? [] : [{ type, level }]
  })
}

/** Peso de cada tipo en el rancho: cuentan todos los que pertenecen a él, estén donde estén */
export const ranchTypeCounts = (s: GameState, ranch: number): Partial<Record<PokeType, number>> =>
  typeWeights(s.owned.filter((m) => m.ranch === ranch).map((m) => m.speciesId))

/** Tipo de rancho colocado en el rancho, si tiene */
export const placedRanchType = (s: GameState, ranch: number) => s.ranchTypeOf[ranch]

/** Lo que rebaja los umbrales de un tipo el tipo de rancho colocado, si lo favorece */
function ranchDiscount(s: GameState, ranch: number, type: PokeType): number {
  const placed = placedRanchType(s, ranch)
  return placed !== undefined && RANCH_TYPES[placed].favors.includes(type) ? RANCH_TYPE_THRESHOLD_DISCOUNT : 0
}

/** Peso de un tipo que hace falta en el rancho para ese nivel de su pasiva */
export const passiveThreshold = (s: GameState, ranch: number, type: PokeType, level: PassiveLevel): number =>
  PASSIVE_THRESHOLDS[level - 1] - ranchDiscount(s, ranch, type)

/** Pasivas que da el rancho a sus Pokémon en rutas, jefes, gimnasios, raids y torre */
export const ranchPassives = (s: GameState, ranch: number): PassiveRef[] =>
  passivesFrom(ranchTypeCounts(s, ranch), (t) => ranchDiscount(s, ranch, t))

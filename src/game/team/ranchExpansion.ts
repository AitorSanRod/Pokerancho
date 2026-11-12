import type { GameState } from '../core/state'
import { ranchCount } from './ranches'
import { spendMoney } from '../core/wallet'

/** Precio en ₽ de cada Ampliación de rancho de la tienda */
export const RANCH_EXPANSION_PRICE = 75_000
/** Espacios que suma cada Ampliación al rancho elegido */
export const RANCH_EXPANSION_SLOTS = 5
/** Ampliaciones que puede tener como mucho cada rancho */
export const RANCH_EXPANSION_MAX = 2

/** Ampliaciones compradas para ese rancho */
export const expansionsOf = (s: GameState, ranch: number): number => (s.ranchExtraSlots[ranch] ?? 0) / RANCH_EXPANSION_SLOTS

/** Si al rancho aún le cabe otra ampliación */
export const canExpand = (s: GameState, ranch: number): boolean => expansionsOf(s, ranch) < RANCH_EXPANSION_MAX

/** Ranchos del jugador que aún se pueden ampliar */
export const expandableRanches = (s: GameState): number[] => Array.from({ length: ranchCount(s) }, (_, i) => i).filter((i) => canExpand(s, i))

/** Por qué no se puede ampliar ese rancho (null si se puede) */
export function expansionBlocker(s: GameState, ranch: number): string | null {
  if (!Number.isInteger(ranch) || ranch < 0 || ranch >= ranchCount(s)) return 'Ese rancho no es tuyo.'
  if (!canExpand(s, ranch)) return `Ya tiene ${RANCH_EXPANSION_MAX} ampliaciones.`
  if (s.money < RANCH_EXPANSION_PRICE) return `Necesitas ₽ ${RANCH_EXPANSION_PRICE}.`
  return null
}

/** Compra una Ampliación y suma sus espacios al rancho elegido */
export function buyRanchExpansion(s: GameState, ranch: number): boolean {
  if (expansionBlocker(s, ranch)) return false
  spendMoney(s, RANCH_EXPANSION_PRICE)
  s.ranchExtraSlots[ranch] = (s.ranchExtraSlots[ranch] ?? 0) + RANCH_EXPANSION_SLOTS
  return true
}

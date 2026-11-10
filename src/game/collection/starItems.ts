import { rarityOf, species } from '../../data/species'
import { STAR_ITEM_IDS, STAR_ITEMS, starItemOfRarity, type StarItem } from '../../data/starItems'
import type { Rng } from '../core/random'
import type { GameState } from '../core/state'

// Objetos estelares (data/starItems.ts): se gastan al crear o evolucionar a un Pokémon raro, épico o legendario. En el
// gacha cada tirada puede dar uno; los que tienen garantía salen seguro tras tantas tiradas sin salir.

export const starItemsOf = (s: GameState, item: StarItem): number => s.starItems[item] ?? 0

export function addStarItems(s: GameState, item: StarItem, count: number) {
  s.starItems[item] = starItemsOf(s, item) + count
}

/** Gasta uno; false si no queda ninguno */
export function spendStarItem(s: GameState, item: StarItem): boolean {
  if (starItemsOf(s, item) < 1) return false
  s.starItems[item] = starItemsOf(s, item) - 1
  return true
}

/** El objeto que pide crear o evolucionar a esa especie; null si no pide ninguno (las comunes) */
export const starItemFor = (speciesId: number): StarItem | null => starItemOfRarity(rarityOf(species(speciesId)))

/** Por qué falta el objeto de esa especie; null si no pide ninguno o si se tiene */
export function starItemBlocker(s: GameState, speciesId: number): string | null {
  const item = starItemFor(speciesId)
  return item && starItemsOf(s, item) < 1 ? `Necesitas un ${STAR_ITEMS[item].name}.` : null
}

/** Tiradas seguidas del gacha sin que haya salido ese objeto (solo los que tienen garantía) */
export const pullsWithout = (s: GameState, item: StarItem): number => s.gachaPity[item] ?? 0

/** Tiradas que faltan para que salga seguro (0 o menos: sale en esta); null si no tiene garantía */
export function pullsToPity(s: GameState, item: StarItem): number | null {
  const pity = STAR_ITEMS[item].pity
  return pity === null ? null : pity - pullsWithout(s, item)
}

/** El objeto que toca sí o sí en esta tirada (el más valioso, si coinciden varios); null si ninguno */
const guaranteed = (s: GameState): StarItem | null => STAR_ITEM_IDS.find((id) => (pullsToPity(s, id) ?? 1) <= 0) ?? null

function rollChance(rng: Rng): StarItem | null {
  let roll = rng()
  for (const id of STAR_ITEM_IDS) {
    roll -= STAR_ITEMS[id].gachaChance
    if (roll < 0) return id
  }
  return null
}

/**
 * Sortea el objeto de una tirada del gacha (como mucho uno) y lo suma. Cuenta la tirada para las garantías; la de un
 * objeto vuelve a empezar cuando sale, por suerte o por garantía
 */
export function rollStarItem(s: GameState, rng: Rng): StarItem | null {
  for (const id of STAR_ITEM_IDS) if (STAR_ITEMS[id].pity !== null) s.gachaPity[id] = pullsWithout(s, id) + 1
  const item = guaranteed(s) ?? rollChance(rng)
  if (item === null) return null
  if (STAR_ITEMS[item].pity !== null) s.gachaPity[item] = 0
  addStarItems(s, item, 1)
  return item
}

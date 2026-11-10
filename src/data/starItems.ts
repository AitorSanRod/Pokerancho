import { ITEM, type Item } from './items'
import { Rarity } from './species'

/**
 * Objetos estelares: uno por rareza (salvo la común), que se gasta al crear o al evolucionar a un Pokémon de esa
 * rareza. Solo salen en el gacha y como premio puesto a mano; se pueden intercambiar, no vender
 */
export const StarItem = { Stardust: 'stardust', StarPiece: 'starPiece', CometShard: 'cometShard' } as const
export type StarItem = (typeof StarItem)[keyof typeof StarItem]

interface StarItemInfo {
  name: string
  /** Plural, para «3 Trozos de estrella» */
  plural: string
  item: Item
  /** Rareza de los Pokémon que lo piden al crearse o al evolucionar a ellos */
  rarity: Rarity
  /** Probabilidad (0-1) de que una tirada del gacha cambie una de sus piezas por este objeto */
  gachaChance: number
  /** Tiradas seguidas sin que salga tras las que sale seguro (la última de ellas); null si no tiene garantía */
  pity: number | null
}

/** Del más valioso al menos: así se sortean en el gacha */
export const STAR_ITEMS: Record<StarItem, StarItemInfo> = {
  [StarItem.CometShard]: {
    name: 'Fragmento de cometa',
    plural: 'Fragmentos de cometa',
    item: ITEM.CometShard,
    rarity: Rarity.Legendary,
    gachaChance: 0.0025,
    pity: 300,
  },
  [StarItem.StarPiece]: {
    name: 'Trozo de estrella',
    plural: 'Trozos de estrella',
    item: ITEM.StarPiece,
    rarity: Rarity.Epic,
    gachaChance: 0.015,
    pity: 60,
  },
  [StarItem.Stardust]: {
    name: 'Polvo estelar',
    plural: 'Polvos estelares',
    item: ITEM.Stardust,
    rarity: Rarity.Rare,
    gachaChance: 0.05,
    pity: null,
  },
}

export const STAR_ITEM_IDS = Object.keys(STAR_ITEMS) as StarItem[]

/** El objeto que piden los Pokémon de esa rareza; null para los comunes */
export const starItemOfRarity = (rarity: Rarity): StarItem | null => STAR_ITEM_IDS.find((id) => STAR_ITEMS[id].rarity === rarity) ?? null

export const isStarItem = (v: unknown): v is StarItem => STAR_ITEM_IDS.includes(v as StarItem)

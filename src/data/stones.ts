import { ITEM, type Item } from './items'

/** Objetos evolutivos (piedras y otros): se compran en la tienda y se gastan al evolucionar */
export const Stone = {
  Fire: 'fire',
  Water: 'water',
  Thunder: 'thunder',
  Leaf: 'leaf',
  Moon: 'moon',
  Sun: 'sun',
  Dawn: 'dawn',
  AuspiciousArmor: 'auspicious-armor',
  MaliciousArmor: 'malicious-armor',
  PrismScale: 'prism-scale',
} as const
export type Stone = (typeof Stone)[keyof typeof Stone]

/** ₽ que cuesta cada piedra evolutiva corriente en la tienda (sin límite de compra) */
const STONE_PRICE = 2000
/** ₽ que cuesta cada armadura de Charcadet (Armarouge o Ceruledge) */
const ARMOR_PRICE = 30_000
/** ₽ que cuesta la Escama Bella (Feebas → Milotic) */
const PRISM_SCALE_PRICE = 500_000

interface StoneInfo {
  name: string
  item: Item
  /** ₽ que cuesta en la tienda */
  price: number
}

export const STONES: Record<Stone, StoneInfo> = {
  [Stone.Fire]: { name: 'Piedra Fuego', item: ITEM.FireStone, price: STONE_PRICE },
  [Stone.Water]: { name: 'Piedra Agua', item: ITEM.WaterStone, price: STONE_PRICE },
  [Stone.Thunder]: { name: 'Piedra Trueno', item: ITEM.ThunderStone, price: STONE_PRICE },
  [Stone.Leaf]: { name: 'Piedra Hoja', item: ITEM.LeafStone, price: STONE_PRICE },
  [Stone.Moon]: { name: 'Piedra Lunar', item: ITEM.MoonStone, price: STONE_PRICE },
  [Stone.Sun]: { name: 'Piedra Solar', item: ITEM.SunStone, price: STONE_PRICE },
  [Stone.Dawn]: { name: 'Piedra Alba', item: ITEM.DawnStone, price: STONE_PRICE },
  [Stone.AuspiciousArmor]: { name: 'Armadura Auspiciosa', item: ITEM.AuspiciousArmor, price: ARMOR_PRICE },
  [Stone.MaliciousArmor]: { name: 'Armadura Maldita', item: ITEM.MaliciousArmor, price: ARMOR_PRICE },
  [Stone.PrismScale]: { name: 'Escama Bella', item: ITEM.PrismScale, price: PRISM_SCALE_PRICE },
}

export const STONE_IDS = Object.keys(STONES) as Stone[]

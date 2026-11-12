import { POKEMON } from './pokemon'
import raw from './pokemon.json'
import type { PokeType } from './types'

interface BaseStats {
  hp: number
  atk: number
  def: number
  spe: number
}

interface Species {
  id: number
  name: string
  types: PokeType[]
  base: BaseStats
  /** Solo en las formas (Rotom Calor…): la especie de la que son forma (ver data/forms.ts) */
  baseId?: number
}

export const Rarity = { Common: 'common', Rare: 'rare', Epic: 'epic', Legendary: 'legendary' } as const
export type Rarity = (typeof Rarity)[keyof typeof Rarity]

interface RarityInfo {
  name: string
  color: string
  /** Probabilidad de que una pieza del gacha sea de esta rareza (las cuatro suman 1) */
  rate: number
  /** ₽ por combinar 5 piezas de un Pokémon que ya tiene las ★ al máximo */
  surplusMoney: number
  /** ₽ que cuesta crear el Pokémon con sus piezas */
  createPrice: number
  /** ₽ que cuesta evolucionar a un Pokémon de esta rareza (la de la evolución, no la del que evoluciona) */
  evolvePrice: number
  /** Pokémon de su tipo que cuenta para las pasivas de rancho (el legendario las sube al máximo, ver ranchPassives.ts) */
  passiveWeight: number
}

export const RARITY_INFO: Record<Rarity, RarityInfo> = {
  [Rarity.Common]: { name: 'Común', color: '#888070', rate: 0.68, surplusMoney: 20, createPrice: 1000, evolvePrice: 1000, passiveWeight: 1 },
  [Rarity.Rare]: { name: 'Raro', color: '#1a6fbf', rate: 0.24, surplusMoney: 50, createPrice: 2500, evolvePrice: 2500, passiveWeight: 2 },
  [Rarity.Epic]: { name: 'Épico', color: '#a040a0', rate: 0.07, surplusMoney: 150, createPrice: 5000, evolvePrice: 5000, passiveWeight: 3 },
  [Rarity.Legendary]: { name: 'Legendario', color: '#e0a000', rate: 0.01, surplusMoney: 500, createPrice: 10000, evolvePrice: 10000, passiveWeight: 3 },
}

interface RawSpecies extends Omit<Species, 'base'> {
  base: BaseStats & { spa: number; spd: number }
}

/** PokeAPI da 6 stats y el juego usa 4: el ataque es el mayor entre físico y especial; la defensa, la media */
function simplifyStats(b: RawSpecies['base']): BaseStats {
  return { hp: b.hp, atk: Math.max(b.atk, b.spa), def: Math.round((b.def + b.spd) / 2), spe: b.spe }
}

const ALL_SPECIES: Species[] = (raw as RawSpecies[]).map((s) => ({ ...s, base: simplifyStats(s.base) }))
const BY_ID = new Map(ALL_SPECIES.map((s) => [s.id, s]))

/** Las especies que se coleccionan (gacha, tickets, Pokédex); sin las formas, que solo se consiguen cambiando de forma */
export const SPECIES: Species[] = ALL_SPECIES.filter((s) => s.baseId === undefined)
/** Las formas (Rotom Calor…): un Pokémon del jugador puede ser una de ellas */
export const FORM_SPECIES: Species[] = ALL_SPECIES.filter((s) => s.baseId !== undefined)

/** Especie o forma que existe: lo que puede llevar un Pokémon del jugador */
export const isKnownSpecies = (id: unknown): id is number => BY_ID.has(id as number)

/** La especie de la que es forma (Rotom Calor → Rotom); la misma si no es una forma */
export const baseSpeciesOf = (id: number): number => BY_ID.get(id)?.baseId ?? id

export function species(id: number): Species {
  const s = BY_ID.get(id)
  if (!s) throw new Error(`Especie desconocida: ${id}`)
  return s
}

function baseStatTotal(s: Species): number {
  const b = s.base
  return b.hp + b.atk + b.def + b.spe
}

/** Umbrales sobre el total de las 4 stats base (Mewtwo, el máximo, suma 480); una forma tiene la de su especie */
export function rarityOf(s: Species): Rarity {
  if (s.baseId !== undefined) return rarityOf(species(s.baseId))
  const bst = baseStatTotal(s)
  if (bst >= 392) return Rarity.Legendary
  if (bst >= 335) return Rarity.Epic
  if (bst >= 275) return Rarity.Rare
  return Rarity.Common
}

const SPRITES = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon'

const ANIMATED = `${SPRITES}/versions/generation-v/black-white/animated`
/** Carpeta extra de los sprites shiny dentro de cada carpeta de PokeAPI */
const shinyDir = (shiny: boolean) => (shiny ? 'shiny/' : '')

export const sprite = {
  front: (id: number, shiny = false) => `${SPRITES}/${shinyDir(shiny)}${id}.png`,
  back: (id: number, shiny = false) => `${SPRITES}/back/${shinyDir(shiny)}${id}.png`,
  animated: (id: number, shiny = false) => `${ANIMATED}/${shinyDir(shiny)}${id}.gif`,
  animatedBack: (id: number, shiny = false) => `${ANIMATED}/back/${shinyDir(shiny)}${id}.gif`,
}

export const STARTERS: number[] = [POKEMON.Bulbasaur, POKEMON.Charmander, POKEMON.Squirtle]

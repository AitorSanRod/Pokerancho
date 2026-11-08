import type { Incursion } from '../../data/incursions'

// Quién puede entrar en una incursión: Pokémon entre su nivel mínimo y su nivel máximo, ambos incluidos.

export const EntryBlock = {
  /** Le falta nivel */
  TooLow: 'too-low',
  /** Se pasa del nivel máximo */
  TooHigh: 'too-high',
} as const
export type EntryBlock = (typeof EntryBlock)[keyof typeof EntryBlock]

/** Por qué no puede entrar un Pokémon de ese nivel; null si puede */
export function entryBlock(inc: Incursion, level: number): EntryBlock | null {
  if (level < inc.minLevel) return EntryBlock.TooLow
  if (level > inc.maxLevel) return EntryBlock.TooHigh
  return null
}

export const canEnter = (inc: Incursion, level: number): boolean => entryBlock(inc, level) === null

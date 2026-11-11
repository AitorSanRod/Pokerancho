import { RoomKind, type Incursion } from '../../data/incursions'
import { possibleFoes } from './foePool'

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

/** Nivel del rival más bajo y del más alto de la incursión (cada Pokémon lucha con su nivel, sin ajustes); sin rivales, los de entrada */
export function foeLevels(inc: Incursion): [number, number] {
  const levels = inc.rooms.flatMap((room) => (room.kind === RoomKind.Battle ? room.foes.flatMap(possibleFoes).map((f) => f.level) : []))
  if (levels.length === 0) return [inc.minLevel, inc.maxLevel]
  return [Math.min(...levels), Math.max(...levels)]
}

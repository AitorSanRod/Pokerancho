import type { Incursion, IncursionFoe } from '../../data/incursions'

// Nivel de la incursión y nivel sincronizado. La incursión se ajusta al Pokémon más alto del grupo dentro de su franja,
// y cada Pokémon lucha a un nivel acercado al de la incursión: los de abajo suben y los de arriba bajan, pero cada uno
// conserva parte de su diferencia, así que uno de nivel mucho más alto se sigue notando.

/** Parte de la diferencia con el nivel de la incursión que conserva cada Pokémon (0: todos iguales; 1: sin sincronizar) */
export const LEVEL_SYNC_KEEP = 0.3

/** El nivel del Pokémon más alto del grupo, sin salir de la franja de la incursión */
export function incursionLevel(inc: Incursion, partyLevels: number[]): number {
  const [low, high] = inc.levels
  return Math.min(high, Math.max(low, ...partyLevels))
}

/** El nivel al que lucha un Pokémon del grupo */
export const syncedLevel = (level: number, atLevel: number): number =>
  Math.max(1, Math.round(atLevel + (level - atLevel) * LEVEL_SYNC_KEEP))

/** El nivel de un rival: el de la incursión más el suyo escrito en el mapa */
export const foeLevel = (foe: IncursionFoe, atLevel: number): number => Math.max(1, atLevel + foe.levelDelta)

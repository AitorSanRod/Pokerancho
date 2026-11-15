import { Biome } from '../../data/maps'
import { species } from '../../data/species'
import type { PokeType } from '../../data/types'

/** Paisaje de la pelea del jefe de la pestaña Raids (que no está en ninguna ruta), según su primer tipo */
const TYPE_BIOME: Record<PokeType, Biome> = {
  normal: Biome.Meadow,
  fire: Biome.Cave,
  water: Biome.Sea,
  electric: Biome.Meadow,
  grass: Biome.Forest,
  ice: Biome.Sea,
  fighting: Biome.Cave,
  poison: Biome.Forest,
  ground: Biome.Cave,
  flying: Biome.Meadow,
  psychic: Biome.Meadow,
  bug: Biome.Forest,
  rock: Biome.Cave,
  ghost: Biome.Cave,
  dragon: Biome.Sea,
  dark: Biome.Cave,
  steel: Biome.Cave,
  fairy: Biome.Forest,
}

/** Paisaje del jefe: el de su primer tipo */
export const raidBiome = (speciesId: number): Biome => TYPE_BIOME[species(speciesId).types[0]]

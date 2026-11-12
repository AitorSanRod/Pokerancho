import { Biome } from '../../data/maps'

// Fondo de la torre infinita: cambia cada pocos pisos, rotando por los biomas de las rutas.

/** Cada cuántos pisos cambia el fondo */
export const TOWER_BIOME_EVERY = 5

/** Biomas por los que va rotando, en orden (sin el laboratorio, que es un interior) */
export const TOWER_BIOMES: Biome[] = [
  Biome.Cave,
  Biome.Forest,
  Biome.Meadow,
  Biome.MtMoon,
  Biome.PewterCity,
  Biome.Sea,
  Biome.CeruleanCity,
  Biome.PalletTown,
]

/** Fondo del piso: el mismo durante TOWER_BIOME_EVERY pisos y luego el siguiente de la lista, en bucle */
export const towerBiome = (floor: number): Biome => TOWER_BIOMES[Math.floor((floor - 1) / TOWER_BIOME_EVERY) % TOWER_BIOMES.length]

import { NORMAL_MOVES } from './normal'
import { FIRE_MOVES } from './fire'
import { WATER_MOVES } from './water'
import { ELECTRIC_MOVES } from './electric'
import { GRASS_MOVES } from './grass'
import { ICE_MOVES } from './ice'
import { FIGHTING_MOVES } from './fighting'
import { POISON_MOVES } from './poison'
import { GROUND_MOVES } from './ground'
import { FLYING_MOVES } from './flying'
import { PSYCHIC_MOVES } from './psychic'
import { BUG_MOVES } from './bug'
import { ROCK_MOVES } from './rock'
import { GHOST_MOVES } from './ghost'
import { DRAGON_MOVES } from './dragon'
import { DARK_MOVES } from './dark'
import { STEEL_MOVES } from './steel'
import { FAIRY_MOVES } from './fairy'

// Catálogo de ataques de incursión: los de los juegos que encajan con lo que hay (sin OHKO, golpes múltiples, daño fijo,
// potencia variable ni efectos que no existen aquí), uno por tipo en cada fichero. Se usan como el resto: `IMOVE.Chispa`.

/** Los catálogos de cada tipo, por separado: así se comprueba que ninguna clave pisa a otra */
export const CATALOG_BY_TYPE = [NORMAL_MOVES, FIRE_MOVES, WATER_MOVES, ELECTRIC_MOVES, GRASS_MOVES, ICE_MOVES, FIGHTING_MOVES, POISON_MOVES, GROUND_MOVES, FLYING_MOVES, PSYCHIC_MOVES, BUG_MOVES, ROCK_MOVES, GHOST_MOVES, DRAGON_MOVES, DARK_MOVES, STEEL_MOVES, FAIRY_MOVES]

export const CATALOG_MOVES = {
  ...NORMAL_MOVES,
  ...FIRE_MOVES,
  ...WATER_MOVES,
  ...ELECTRIC_MOVES,
  ...GRASS_MOVES,
  ...ICE_MOVES,
  ...FIGHTING_MOVES,
  ...POISON_MOVES,
  ...GROUND_MOVES,
  ...FLYING_MOVES,
  ...PSYCHIC_MOVES,
  ...BUG_MOVES,
  ...ROCK_MOVES,
  ...GHOST_MOVES,
  ...DRAGON_MOVES,
  ...DARK_MOVES,
  ...STEEL_MOVES,
  ...FAIRY_MOVES,
}

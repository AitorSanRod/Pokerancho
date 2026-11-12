import { species } from '../../data/species'

/** Caja del sprite de un rival en combate (también la de tu Pokémon y la de cada Pokémon de una incursión) */
export const ENEMY_SPRITE_SIZE = 112
/** El jefe se ve un 30% más grande que un salvaje */
export const BOSS_SPRITE_SIZE = Math.round(ENEMY_SPRITE_SIZE * 1.3)

/** Altura (dm) hasta la que un Pokémon se ve con el tamaño mínimo: Caterpie, Pikachu pequeño… */
const SMALL_HEIGHT_DM = 3
/** Altura (dm) desde la que un Pokémon llena su caja: Onix, Gyarados… */
const BIG_HEIGHT_DM = 40
/** Parte de la caja que ocupa el lado mayor de un Pokémon pequeño (uno grande la llena entera) */
const MIN_FIT = 0.45

/**
 * Parte de la caja que ocupa el Pokémon en combate según su altura real. La curva es logarítmica: entre los pequeños
 * se nota más la diferencia que entre los grandes, y ni los diminutos desaparecen ni los enormes se salen.
 */
export function battleFit(speciesId: number): number {
  const { height } = species(speciesId)
  const t = Math.log(height / SMALL_HEIGHT_DM) / Math.log(BIG_HEIGHT_DM / SMALL_HEIGHT_DM)
  return MIN_FIT + (1 - MIN_FIT) * Math.min(1, Math.max(0, t))
}

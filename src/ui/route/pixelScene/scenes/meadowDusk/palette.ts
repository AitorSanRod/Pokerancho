// Colores del prado al atardecer (tarde dorada): cielo de azul violeta a naranja en el horizonte, colinas lilas por
// la bruma, verdes más cálidos y camino rosado. Cada rampa va de oscuro a claro, salvo el cielo (de arriba abajo).

import { hex, palette } from '../../paint/pixmap'
import type { MeadowColors } from '../meadow/palette'

/** Cielo de arriba abajo: azul violeta, lila, rosa, naranja y oro junto al horizonte */
export const DUSK_SKY = palette('#4c5cac', '#5e64b2', '#7a6cb6', '#9a76b6', '#bc7eb0', '#dc88a2', '#f09a92', '#f8ae84', '#fcc47c')
/** Cielo detrás de las colinas, el tono más claro */
export const HORIZON_GLOW = hex('#fed892')
/** Sol: borde, cuerpo y centro */
export const SUN = palette('#ffc860', '#fff0b8', '#fffcec')
/** Halo del sol (se pinta semitransparente, en anillos) */
export const SUN_HALO = '#ffe6a4'

export const DUSK: MeadowColors = {
  cloud: palette('#c88cb4', '#eea2a6', '#fcc2a2', '#fee2c4'),
  farHills: palette('#8c6c9e', '#9c78a6', '#b086ae', '#c696b4'),
  hills: palette('#3e5e52', '#4c7052', '#628452', '#829a56'),
  meadow: palette('#88a03a', '#a2ae40', '#bcbc4c', '#d6c85e'),
  meadowTrees: palette('#283a2e', '#344c30', '#465e36', '#5e723c', '#828c4a'),
  trunk: palette('#3e2418', '#5e3a24', '#80502e', '#a86a3c', '#cc8a4e'),
  trunkInk: hex('#28160e'),
  fern: palette('#1e2a2e', '#2a3a34', '#3a4c38', '#52603e'),
  plants: palette('#24402e', '#325632', '#56783a', '#82944a'),
  nearTrees: palette('#1e3628', '#2a4a30', '#3e6036', '#5c7a3e', '#86924c'),
  nearTreesInk: hex('#182a20'),
  grass: palette('#3c6430', '#4e7c38', '#6c963e', '#8eac48', '#b4c05a'),
  grassInk: hex('#32562c'),
  dirt: palette('#d87a50', '#e88e5a', '#f0a268', '#f6ba7e'),
  dirtInk: hex('#b0623e'),
  house: {
    roof: palette('#a83a36', '#c84e40', '#e8745a'),
    roofInk: hex('#521a1a'),
    wall: palette('#c0a088', '#d8bca0', '#ecd4b4', '#f8e4c8'),
    wallInk: hex('#56443a'),
    wood: palette('#542e1c', '#84502c', '#ac7440'),
    glass: palette('#5a6aa8', '#e89a7c', '#fde0b0'),
    brick: palette('#7a3a2c', '#a25640', '#c4765a'),
  },
  wood: palette('#542c1a', '#7c4a2a', '#9c6234', '#c4824a', '#e4a86a'),
  daisy: { petals: hex('#fde8d4'), shade: hex('#dcb0b0'), center: hex('#f0a020') },
  buttercup: { petals: hex('#f8c838'), shade: hex('#d88a20'), center: hex('#b85a14') },
}

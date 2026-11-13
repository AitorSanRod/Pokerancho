// Suelo del prado: el camino de tierra y las matas que se mecen en sus bordes.

import { grassField, scatterTufts, tuftFrames, type TuftStyle } from '../../elements/grass'
import { between, hash, makeRng, valueNoise } from '../../paint/noise'
import { Pixmap } from '../../paint/pixmap'
import { ramp } from '../../paint/shade'
import { DAY, type MeadowColors } from './palette'

/** Filas del camino (de arriba abajo): hierba del fondo, tierra y hierba de delante */
export const PATH = { height: 72, dirtTop: 8, dirtBottom: 60 }

/** Manchas claras de la tierra: tamaño de celda del ruido, en píxeles de arte */
const PATCH_CELL = 24
/** Ancho de la tesela del camino: larga para que las manchas no se repitan a la vista */
const PATH_WIDTH = 960

/** Briznas que cuelgan de la hierba sobre la tierra: cuántos píxeles baja cada columna */
const blade = (x: number, seed: number) => (hash(x, 3, seed) < 0.4 ? 1 + Math.floor(hash(x, 4, seed) * 3) : 0)

export function path(seed: number, c: MeadowColors = DAY): Pixmap {
  const rng = makeRng(seed + 7)
  const pix = new Pixmap(PATH_WIDTH, PATH.height)
  const { dirt, dirtInk, grass, grassInk } = c
  const field = [grass[1], grass[2], grass[4]]
  grassField(pix, rng, 0, PATH.dirtTop, field)
  grassField(pix, rng, PATH.dirtBottom, PATH.height - PATH.dirtBottom, field)
  for (let x = 0; x < pix.w; x++) {
    for (let y = PATH.dirtTop; y < PATH.dirtBottom; y++) {
      const patch = valueNoise(x, y * 3, PATCH_CELL, pix.w, seed) + (hash(x, y, seed) - 0.5) * 0.08
      const shadow = y < PATH.dirtTop + 3 ? 0.4 : 0
      pix.set(x, y, ramp(dirt, 0.25 + patch * 0.75 - shadow, x, y, 0))
    }
    pix.set(x, PATH.dirtTop, grassInk)
    for (let k = 1; k <= blade(x, seed); k++) pix.set(x, PATH.dirtTop + k, k === blade(x, seed) ? grassInk : grass[1])
    const up = blade(x, seed + 1)
    for (let k = 0; k <= up; k++) pix.set(x, PATH.dirtBottom - k, k === up ? grass[3] : grass[2])
  }
  for (let i = 0; i < 60; i++) {
    const x = Math.round(rng() * pix.w)
    const y = Math.round(between(rng, PATH.dirtTop + 6, PATH.dirtBottom - 4))
    const w = rng() < 0.5 ? 2 : 3
    pix.rect(x, y, w, 1, dirtInk)
    pix.rect(x, y - 1, w - 1, 1, dirt[3])
  }
  return pix
}

const backStyle = (c: MeadowColors): TuftStyle => ({ grass: c.grass, minHeight: 3, maxHeight: 9, sway: 1.5 })
const frontStyle = (c: MeadowColors): TuftStyle => ({ grass: c.grass, minHeight: 5, maxHeight: 13, sway: 2 })

/** Matas al borde de atrás del camino, que se mecen */
export function backTufts(seed: number, frames: number, c: MeadowColors = DAY): Pixmap[] {
  const style = backStyle(c)
  const tufts = scatterTufts(makeRng(seed + 8), 160, 20, style, [c.daisy])
  return tuftFrames(160, 14, tufts, style, frames)
}

/** Matas al borde de delante del camino, por delante del Pokémon */
export function frontTufts(seed: number, frames: number, c: MeadowColors = DAY): Pixmap[] {
  const style = frontStyle(c)
  const tufts = scatterTufts(makeRng(seed + 9), 200, 18, style, [c.daisy])
  return tuftFrames(200, 18, tufts, style, frames)
}

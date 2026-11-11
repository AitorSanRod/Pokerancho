// Muebles del laboratorio sobre el parqué, entre la pared y el Pokémon: mesas con cosas encima y plantas en maceta,
// en grupos con huecos. Y alguna planta grande en primer plano, por delante del Pokémon.

import { labBench, type BenchPalette } from '../../elements/labBench'
import { pottedPlant, type PlantPalette } from '../../elements/pottedPlant'
import { between, makeRng, type Rng } from '../../paint/noise'
import { Pixmap } from '../../paint/pixmap'
import * as C from './palette'

/** Ancho y alto de la tesela de muebles (ancha: los grupos aparecen de tarde en tarde) */
const FURNITURE = { width: 900, height: 52 }
/** Separación entre grupos de muebles [mín, máx] */
const GROUP_GAP: [number, number] = [120, 210]
/** Filas de sombra en el suelo bajo los muebles */
const SHADOW_ROWS = 2

const BENCH: BenchPalette = { metal: C.METAL, screen: C.SCREEN, leds: C.LEDS, glass: C.GLASS, liquids: C.LIQUIDS, books: C.BOOKS }
const PLANT: PlantPalette = { pot: C.POT, leaves: C.LEAVES }

export function furniture(seed: number): Pixmap {
  const rng = makeRng(seed + 331)
  const pix = new Pixmap(FURNITURE.width, FURNITURE.height)
  const groundY = pix.h - 1 - SHADOW_ROWS
  for (let x = between(rng, 20, 60); x < FURNITURE.width - 80; x += between(rng, ...GROUP_GAP)) group(pix, rng, Math.round(x), groundY)
  return pix
}

/** Una mesa (a veces con una planta al lado) o una planta sola, con su sombra hacia la derecha */
function group(pix: Pixmap, rng: Rng, x: number, groundY: number) {
  const roll = rng()
  let width = 0
  if (roll < 0.7) {
    width = Math.round(between(rng, 40, 60))
    labBench(pix, rng, BENCH, x, groundY, width)
  }
  if (roll >= 0.45) {
    const size = Math.round(between(rng, 14, 20))
    pottedPlant(pix, rng, PLANT, x + width + Math.round(size * 0.7) + 2, groundY, size)
    width += Math.round(size * 1.4) + 4
  }
  pix.rect(x + 1, groundY + 1, width + 2, SHADOW_ROWS, C.FLOOR_SHADOW)
}

/** Ancho de la tesela de primer plano (muy ancha: una planta de vez en cuando) */
const FRONT_WIDTH = 1300

/** Plantas grandes en maceta por delante del Pokémon, que asoman por abajo */
export function frontPlants(seed: number): Pixmap {
  const rng = makeRng(seed + 341)
  const pix = new Pixmap(FRONT_WIDTH, 60)
  for (const at of [0.2, 0.68]) pottedPlant(pix, rng, PLANT, Math.round(FRONT_WIDTH * at + between(rng, -60, 60)), pix.h - 1, Math.round(between(rng, 30, 38)))
  return pix
}

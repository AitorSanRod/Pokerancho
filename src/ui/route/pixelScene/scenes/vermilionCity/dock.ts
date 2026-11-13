// Dársena de Ciudad Carmín, entre las casas y la calle: muelle de madera al fondo con sus pilotes, agua con
// destellos, boyas y una barca que se mecen y, delante, el borde de tablones con valla de cuerda, bolardos y farolas.

import { buoy, rowboat } from '../../elements/harbor'
import { lamppost } from '../../elements/lamppost'
import { bollard, piling, plankEdge, ropeFence } from '../../elements/pier'
import { between, hash, makeRng } from '../../paint/noise'
import { Pixmap } from '../../paint/pixmap'
import { BOAT, BUOY, LAMP, NEAR_WATER, PIER } from './palette'

/** Tesela de la dársena y filas de cada parte, en píxeles de arte (la fila de abajo queda tras la acera) */
const DOCK = { width: 600, height: 52, bankTop: 15, waterTop: 20, quayTop: 38, fenceBase: 42 }
/** Destellos del agua por tesela y cuánto se desplazan en un ciclo de fotogramas */
const GLINTS = { count: 34, drift: 4 }
/** Separación entre farolas, en píxeles de arte, y sitio de los bolardos */
const LAMP_GAP = [150, 220] as const
const BOLLARDS = [70, 255, 430]
/** Pilotes del muelle del fondo: separación; y alto de los que salen del agua delante */
const BACK_PILING_GAP = 30
const MOORING_HEIGHT = 9
/** Lo que se hunden y suben las boyas y la barca, en píxeles de arte */
const BOB = 1

/** Agua: sombra del muelle arriba, tono base y destellos que se desplazan con el fotograma */
function water(pix: Pixmap, seed: number, frame: number, frames: number) {
  const [deep, base, light, crest] = NEAR_WATER
  pix.rect(0, DOCK.waterTop, pix.w, DOCK.quayTop - DOCK.waterTop, base)
  pix.rect(0, DOCK.waterTop, pix.w, 2, deep)
  const shift = Math.round(Math.sin((2 * Math.PI * frame) / frames) * GLINTS.drift)
  for (let i = 0; i < GLINTS.count; i++) {
    const x = Math.round(hash(i, 0, seed) * pix.w) + (i % 2 ? shift : -shift)
    const y = DOCK.waterTop + 3 + Math.round(hash(i, 1, seed) * (DOCK.quayTop - DOCK.waterTop - 5))
    const length = 3 + Math.round(hash(i, 2, seed) * 5)
    pix.rect(x, y, length, 1, light)
    pix.rect(x + 1, y - 1, Math.max(1, length - 3), 1, crest)
  }
}

/** Pilotes bajo el muelle del fondo, que se meten un poco en el agua */
function backPilings(pix: Pixmap) {
  for (let x = 8; x < pix.w; x += BACK_PILING_GAP) {
    pix.rect(x, DOCK.waterTop, 2, 3, PIER.wood[1])
    pix.set(x + 2, DOCK.waterTop, PIER.wood[0])
  }
}

export function dock(seed: number, frames: number): Pixmap[] {
  const rng = makeRng(seed + 50)
  const lamps: number[] = []
  for (let x = 120; x < DOCK.width - 60; x += between(rng, ...LAMP_GAP)) lamps.push(Math.round(x))
  const buoys = [Math.round(between(rng, 40, 110)), Math.round(between(rng, 470, 540))]
  const moorings = [Math.round(between(rng, 200, 230)), Math.round(between(rng, 380, 420))]
  const boatX = Math.round(between(rng, 280, 340))
  return Array.from({ length: frames }, (_, f) => {
    const pix = new Pixmap(DOCK.width, DOCK.height)
    const bob = Math.round(Math.sin((2 * Math.PI * f) / frames) * BOB)
    plankEdge(pix, DOCK.bankTop, DOCK.waterTop - DOCK.bankTop, PIER)
    water(pix, seed, f, frames)
    backPilings(pix)
    for (const [i, x] of buoys.entries()) buoy(pix, x, DOCK.waterTop + 12 + (i % 2 ? -bob : bob), 4, BUOY)
    rowboat(pix, boatX, DOCK.waterTop + 12 - bob, 32, BOAT)
    for (const x of moorings) piling(pix, x, DOCK.quayTop - 1, MOORING_HEIGHT, PIER)
    plankEdge(pix, DOCK.quayTop, DOCK.height - DOCK.quayTop, PIER, 5)
    ropeFence(pix, DOCK.fenceBase, PIER)
    for (const x of BOLLARDS) bollard(pix, x, DOCK.fenceBase + 2, PIER)
    for (const x of lamps) lamppost(pix, x, DOCK.fenceBase + 1, LAMP)
    return pix
  })
}

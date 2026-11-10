// Canal de Ciudad Celeste, entre las casas y la calle: orilla de piedra al fondo, agua con destellos que se mueven,
// alguna boya y una barca que se mecen, el borde del muelle y, delante, barandilla, farolas y anclas.

import { lamppost } from '../../elements/lamppost'
import { anchor, buoy, railing, rowboat } from '../../elements/harbor'
import { between, hash, makeRng } from '../../paint/noise'
import { Pixmap } from '../../paint/pixmap'
import { ANCHOR, BOAT, BUOY, LAMP, NEAR_WATER, QUAY, RAILING } from './palette'

/** Tesela del canal y filas de cada parte, en píxeles de arte (la fila de abajo de la tesela queda tras la acera) */
const CANAL = { width: 600, height: 52, bankTop: 16, waterTop: 20, quayTop: 38, railBase: 42 }
/** Sillar de las orillas: largo en píxeles de arte */
const BLOCK = 12
/** Destellos del agua por tesela y cuánto se desplazan en un ciclo de fotogramas */
const GLINTS = { count: 34, drift: 4 }
/** Separación entre farolas y entre anclas, en píxeles de arte */
const LAMP_GAP = [140, 200] as const
const ANCHORS = [95, 410]
/** Lo que se hunden y suben las boyas y la barca, en píxeles de arte */
const BOB = 1

/** Orilla de piedra de `height` filas: canto claro, cara en dos tonos y juntas verticales desplazadas */
function stoneEdge(pix: Pixmap, top: number, height: number, offset: number) {
  pix.rect(0, top, pix.w, 1, QUAY[4])
  pix.rect(0, top + 1, pix.w, height - 1, QUAY[2])
  pix.rect(0, top + height - 1, pix.w, 1, QUAY[1])
  for (let x = offset; x < pix.w + offset; x += BLOCK) pix.rect(x, top + 1, 1, height - 1, QUAY[0])
}

/** Agua del canal: sombra de la orilla arriba, tono base y destellos que se desplazan con el fotograma */
function water(pix: Pixmap, seed: number, frame: number, frames: number) {
  const [deep, base, light, crest] = NEAR_WATER
  pix.rect(0, CANAL.waterTop, pix.w, CANAL.quayTop - CANAL.waterTop, base)
  pix.rect(0, CANAL.waterTop, pix.w, 2, deep)
  const shift = Math.round(Math.sin((2 * Math.PI * frame) / frames) * GLINTS.drift)
  for (let i = 0; i < GLINTS.count; i++) {
    const x = Math.round(hash(i, 0, seed) * pix.w) + (i % 2 ? shift : -shift)
    const y = CANAL.waterTop + 3 + Math.round(hash(i, 1, seed) * (CANAL.quayTop - CANAL.waterTop - 5))
    const length = 3 + Math.round(hash(i, 2, seed) * 5)
    pix.rect(x, y, length, 1, light)
    pix.rect(x + 1, y - 1, Math.max(1, length - 3), 1, crest)
  }
}

export function canal(seed: number, frames: number): Pixmap[] {
  const rng = makeRng(seed + 40)
  const lamps: number[] = []
  for (let x = 40; x < CANAL.width - 60; x += between(rng, ...LAMP_GAP)) lamps.push(Math.round(x))
  const buoys = [Math.round(between(rng, 180, 260)), Math.round(between(rng, 480, 560))]
  const boatX = Math.round(between(rng, 300, 360))
  return Array.from({ length: frames }, (_, f) => {
    const pix = new Pixmap(CANAL.width, CANAL.height)
    const bob = Math.round(Math.sin((2 * Math.PI * f) / frames) * BOB)
    stoneEdge(pix, CANAL.bankTop, CANAL.waterTop - CANAL.bankTop, 0)
    water(pix, seed, f, frames)
    for (const [i, x] of buoys.entries()) buoy(pix, x, CANAL.waterTop + 12 + (i % 2 ? -bob : bob), 4, BUOY)
    rowboat(pix, boatX, CANAL.waterTop + 12 - bob, 32, BOAT)
    stoneEdge(pix, CANAL.quayTop, CANAL.height - CANAL.quayTop, BLOCK / 2)
    railing(pix, CANAL.railBase, RAILING)
    for (const x of ANCHORS) anchor(pix, x, CANAL.railBase + 1, ANCHOR)
    for (const x of lamps) lamppost(pix, x, CANAL.railBase + 1, LAMP)
    return pix
  })
}

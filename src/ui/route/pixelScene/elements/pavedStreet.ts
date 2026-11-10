// Calle de losas de piedra entre dos bordillos, con una franja detrás y otra delante (césped o muelle). Cada losa
// tiene su tono, canto iluminado arriba y sombra abajo y a la derecha; junto al bordillo de atrás la calle queda en
// sombra.

import { hash, makeRng, type Rng } from '../paint/noise'
import { Pixmap, type Color } from '../paint/pixmap'
import { PATH } from '../scenes/meadow/ground'

export interface StreetPalette {
  /** Losas: sombra, base, luz y brillo */
  paving: readonly Color[]
  mortar: Color
  /** Bordillo: sombra, base y canto iluminado */
  curb: readonly Color[]
  /** Franja de detrás y de delante de la calle, a lo ancho de la tesela */
  verge: { back: Verge; front: Verge }
}

/** Pinta la franja de `height` filas que empieza en `top` */
export type Verge = (pix: Pixmap, rng: Rng, top: number, height: number) => void

/** Losa: ancho y alto en píxeles de arte (cada fila va desplazada media losa) */
const SLAB = { width: 16, height: 8 }
/** Tesela de la calle, en losas (larga para que las losas oscuras no se repitan a la vista) */
const STREET_SLABS = 60
/** Probabilidad de que una losa sea de piedra más oscura */
const DARK_SLAB = 0.06
/** Filas en sombra junto al bordillo de atrás */
const CURB_SHADOW = 3

function slab(pix: Pixmap, p: StreetPalette, x: number, y: number, seed: number) {
  const row = Math.floor((y - PATH.dirtTop) / SLAB.height)
  const shifted = x + (row % 2) * (SLAB.width / 2)
  const tx = Math.floor(shifted / SLAB.width)
  const inX = shifted % SLAB.width
  const inY = (y - PATH.dirtTop) % SLAB.height
  const dark = hash(tx, row, seed) < DARK_SLAB
  const tone = dark ? 0 : 1 + (hash(tx, row, seed + 1) < 0.5 ? 0 : 1)
  const lastX = inX === SLAB.width - 1
  const lastY = inY === SLAB.height - 1
  const corner = (inX === 1 || lastX) && (inY === 1 || lastY)
  if (inX === 0 || inY === 0 || corner) return pix.set(x, y, p.mortar)
  if (y < PATH.dirtTop + CURB_SHADOW) return pix.set(x, y, p.paving[0])
  const highlight = inY === 1 || inX === 1
  pix.set(x, y, lastX || lastY ? p.paving[0] : highlight && !dark ? p.paving[tone + 1] : p.paving[tone])
}

/** Bordillo de dos filas: canto claro arriba, cara en sombra y junta debajo */
function curb(pix: Pixmap, curbColors: readonly Color[], y: number) {
  pix.rect(0, y, pix.w, 1, curbColors[2])
  pix.rect(0, y + 1, pix.w, 1, curbColors[1])
  pix.rect(0, y + 2, pix.w, 1, curbColors[0])
  for (let x = 0; x < pix.w; x += SLAB.width * 2) pix.set(x, y + 1, curbColors[0])
}

export function pavedStreet(seed: number, p: StreetPalette): Pixmap {
  const rng = makeRng(seed + 22)
  const pix = new Pixmap(STREET_SLABS * SLAB.width, PATH.height)
  p.verge.back(pix, rng, 0, PATH.dirtTop)
  p.verge.front(pix, rng, PATH.dirtBottom, PATH.height - PATH.dirtBottom)
  for (let x = 0; x < pix.w; x++) for (let y = PATH.dirtTop; y < PATH.dirtBottom; y++) slab(pix, p, x, y, seed)
  curb(pix, p.curb, PATH.dirtTop - 3)
  curb(pix, p.curb, PATH.dirtBottom)
  return pix
}

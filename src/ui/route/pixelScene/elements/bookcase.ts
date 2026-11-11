// Estantería de madera llena de libros de colores, con huecos, algún libro tumbado o inclinado y cajas.

import { insetBox, shadedBox } from '../paint/box'
import { between, pick, type Rng } from '../paint/noise'
import type { Color, Pixmap } from '../paint/pixmap'

export interface BookcasePalette {
  /** Madera: contorno, sombra, base y luz */
  wood: readonly Color[]
  /** Lomos de libro: cada uno, base y sombra */
  books: readonly (readonly Color[])[]
}

/** Alto de cada balda (hueco más tabla), en píxeles de arte */
const SHELF_HEIGHT = 13

/** Estantería de `width`×`height` apoyada en `groundY` */
export function bookcase(pix: Pixmap, rng: Rng, p: BookcasePalette, x: number, groundY: number, width: number, height: number) {
  const top = groundY - height + 1
  const wood = p.wood.slice(1)
  shadedBox(pix, x, top, width, height, wood)
  pix.rect(x, groundY, width, 1, p.wood[0])
  pix.rect(x + width - 1, top, 1, height, p.wood[0])
  const shelves = Math.floor((height - 6) / SHELF_HEIGHT)
  for (let i = 0; i < shelves; i++) {
    const y = top + 3 + i * SHELF_HEIGHT
    insetBox(pix, x + 2, y, width - 4, SHELF_HEIGHT - 2, [p.wood[0], p.wood[1], p.wood[1]])
    shelfRow(pix, rng, p, x + 3, y + SHELF_HEIGHT - 3, width - 6)
  }
}

/** Libros de pie sobre la balda, de izquierda a derecha, con algún hueco */
function shelfRow(pix: Pixmap, rng: Rng, p: BookcasePalette, x: number, floorY: number, width: number) {
  let cx = x + Math.round(between(rng, 0, 3))
  while (cx < x + width - 2) {
    if (rng() < 0.12) {
      cx += Math.round(between(rng, 3, 6))
      continue
    }
    const w = rng() < 0.6 ? 2 : 3
    if (cx + w > x + width) break
    const h = Math.round(between(rng, 6, 10))
    const [base, shadow] = pick(rng, p.books)
    if (rng() < 0.1 && cx + h <= x + width) {
      pix.rect(cx, floorY - w + 1, h, w, base)
      pix.rect(cx, floorY, h, 1, shadow)
      cx += h + 1
      continue
    }
    pix.rect(cx, floorY - h + 1, w, h, base)
    pix.rect(cx + w - 1, floorY - h + 1, 1, h, shadow)
    if (h > 7) pix.rect(cx, floorY - h + 3, w - 1, 1, shadow)
    cx += w
  }
}

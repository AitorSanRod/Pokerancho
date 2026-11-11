// Planta de interior en maceta: hojas anchas (las de `leaves`) que salen de una maceta con borde.

import { BROAD_LEAVES, leafFrames, makeClump } from './leaves'
import type { Rng } from '../paint/noise'
import type { Color, Pixmap } from '../paint/pixmap'

export interface PlantPalette {
  /** Maceta: sombra, base y luz */
  pot: readonly Color[]
  /** Hojas: contorno, sombra, base y luz */
  leaves: readonly Color[]
}

/** Planta de tamaño `size` (alto aproximado de las hojas) centrada en `cx` y apoyada en `groundY` */
export function pottedPlant(pix: Pixmap, rng: Rng, p: PlantPalette, cx: number, groundY: number, size: number) {
  const potH = Math.max(5, Math.round(size * 0.42))
  const potW = Math.max(6, Math.round(size * 0.5))
  const potTop = groundY - potH + 1
  const leafW = size * 2
  const [leaves] = leafFrames(leafW, size, [makeClump(rng, size, size, BROAD_LEAVES)], p.leaves, 1)
  pix.stamp(leaves, cx - size, potTop - size + 3)
  for (let row = 0; row < potH; row++) {
    const half = Math.floor(potW / 2) - Math.floor((row * 2) / potH)
    const y = potTop + row
    pix.rect(cx - half, y, half * 2 + 1, 1, p.pot[1])
    pix.set(cx - half, y, p.pot[2])
    pix.set(cx + half, y, p.pot[0])
  }
  const rim = Math.floor(potW / 2) + 1
  pix.rect(cx - rim, potTop - 1, rim * 2 + 1, 2, p.pot[1])
  pix.rect(cx - rim, potTop - 1, rim * 2 + 1, 1, p.pot[2])
  pix.rect(cx - rim, potTop, rim * 2 + 1, 1, p.pot[0])
  pix.rect(cx - Math.floor(potW / 2) + 1, groundY, potW - 1, 1, p.pot[0])
}

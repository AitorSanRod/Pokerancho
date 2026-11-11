// Cosas colgadas en la pared de un interior: pizarra blanca con dibujos y reloj redondo.

import { disc, shadedBox } from '../paint/box'
import { between, pick, type Rng } from '../paint/noise'
import type { Color, Pixmap } from '../paint/pixmap'

export interface DecorPalette {
  /** Marco metálico: contorno, sombra, base, luz y brillo */
  metal: readonly Color[]
  /** Rotuladores de colores */
  markers: readonly Color[]
}

/** Pizarra blanca con una Poké Ball dibujada, garabatos de texto y la bandeja de rotuladores */
export function whiteboard(pix: Pixmap, rng: Rng, p: DecorPalette, x: number, top: number, width: number, height: number) {
  shadedBox(pix, x, top, width, height, p.metal.slice(2, 5))
  pix.rect(x + width - 1, top, 1, height, p.metal[1])
  pix.rect(x + 2, top + 2, width - 4, height - 4, p.metal[4])
  const ballX = x + 7
  const ballY = top + Math.round(height / 2)
  disc(pix, ballX, ballY, 4, p.metal[0])
  disc(pix, ballX, ballY, 3, p.metal[4])
  for (let dx = -3; dx <= 3; dx++) for (let dy = -3; dy < 0; dy++) if (dx * dx + dy * dy <= 10) pix.set(ballX + dx, ballY + dy, p.markers[0])
  pix.rect(ballX - 4, ballY, 9, 1, p.metal[0])
  pix.set(ballX, ballY, p.metal[4])
  for (let ly = top + 4; ly < top + height - 4; ly += 3) {
    const len = Math.round(between(rng, 6, width - 20))
    pix.rect(x + 14, ly, len, 1, pick(rng, p.markers.slice(1)))
  }
  pix.rect(x + 4, top + height, width - 8, 1, p.metal[2])
  pix.rect(x + 4, top + height + 1, width - 8, 1, p.metal[0])
  pix.rect(x + 7, top + height - 1, 3, 1, p.markers[1])
  pix.rect(x + 12, top + height - 1, 3, 1, p.markers[2])
}

/** Reloj redondo de pared con las agujas a una hora cualquiera */
export function wallClock(pix: Pixmap, p: DecorPalette, cx: number, cy: number) {
  disc(pix, cx + 1, cy + 1, 5, p.metal[0])
  disc(pix, cx, cy, 5, p.metal[2])
  disc(pix, cx, cy, 4, p.metal[4])
  pix.rect(cx, cy - 3, 1, 3, p.metal[0])
  pix.rect(cx + 1, cy, 2, 1, p.metal[0])
  pix.set(cx, cy, p.markers[0])
}

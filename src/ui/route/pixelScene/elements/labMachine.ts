// Máquinas de laboratorio: armario de ordenador con pantalla, pilotos, ruedas de mando y rejilla, y la pantalla
// suelta (monitor) para poner encima de las mesas.

import { disc, insetBox, shadedBox } from '../paint/box'
import { between, pick, type Rng } from '../paint/noise'
import type { Color, Pixmap } from '../paint/pixmap'

export interface MachinePalette {
  /** Metal: contorno, sombra, base, luz y brillo */
  metal: readonly Color[]
  /** Pantalla: fondo, letras y brillo */
  screen: readonly Color[]
  /** Pilotos de colores */
  leds: readonly Color[]
}

/** Pantalla con líneas de texto verde y un reflejo en la esquina */
function screen(pix: Pixmap, rng: Rng, p: MachinePalette, x: number, y: number, w: number, h: number) {
  insetBox(pix, x, y, w, h, [p.metal[0], p.screen[0], p.metal[3]])
  for (let ly = y + 2; ly < y + h - 2; ly += 2) pix.rect(x + 2, ly, Math.round(between(rng, 2, w - 4)), 1, p.screen[1])
  pix.set(x + w - 3, y + 2, p.screen[2])
}

/** Armario de ordenador de `width`×`height` apoyado en `groundY` */
export function labMachine(pix: Pixmap, rng: Rng, p: MachinePalette, x: number, groundY: number, width: number, height: number) {
  const top = groundY - height + 1
  shadedBox(pix, x, top, width, height, p.metal.slice(1, 4))
  pix.rect(x + 1, top, width - 2, 1, p.metal[4])
  pix.rect(x + width - 1, top, 1, height, p.metal[0])
  pix.rect(x, groundY, width, 1, p.metal[0])
  const screenH = Math.round(height * 0.34)
  screen(pix, rng, p, x + 3, top + 3, width - 6, screenH)
  const ledY = top + screenH + 6
  for (let lx = x + 4; lx < x + width - 4; lx += 3) pix.set(lx, ledY, pick(rng, p.leds))
  const dialY = ledY + 6
  for (const dx of [0.3, 0.7]) {
    const cx = x + Math.round(width * dx)
    disc(pix, cx, dialY, 2, p.metal[1])
    pix.set(cx - 1, dialY - 1, p.metal[4])
  }
  for (let vy = dialY + 6; vy < groundY - 3; vy += 2) pix.rect(x + 4, vy, width - 8, 1, p.metal[1])
}

/** Monitor de sobremesa con su pie; `baseY` es la fila de la mesa */
export function monitor(pix: Pixmap, rng: Rng, p: MachinePalette, x: number, baseY: number, width: number) {
  const height = Math.round(width * 0.75)
  const top = baseY - height - 2
  shadedBox(pix, x, top, width, height, p.metal.slice(2, 5))
  pix.rect(x + width - 1, top, 1, height, p.metal[1])
  screen(pix, rng, p, x + 2, top + 2, width - 4, height - 4)
  const neck = x + Math.floor(width / 2) - 1
  pix.rect(neck, top + height, 3, 1, p.metal[1])
  pix.rect(neck - 2, baseY - 1, 7, 1, p.metal[2])
}

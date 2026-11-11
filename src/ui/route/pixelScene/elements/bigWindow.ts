// Ventanal de interior con lo de fuera de día: cielo, alguna nube y árboles en el horizonte, reflejos en el
// cristal, parteluces, travesaño y alféizar. Luz arriba a la izquierda.

import { disc } from '../paint/box'
import { between, type Rng } from '../paint/noise'
import { Pixmap, type Color } from '../paint/pixmap'

export interface WindowPalette {
  /** Marco: sombra, base, luz y brillo */
  frame: readonly Color[]
  /** Cielo de fuera, del alto al horizonte */
  sky: readonly Color[]
  /** Árboles de fuera: sombra, base y luz */
  trees: readonly Color[]
  /** Nubes: sombra y luz */
  cloud: readonly Color[]
  glare: Color
}

export interface WindowSpec {
  x: number
  /** Fila de arriba del marco */
  top: number
  width: number
  /** Fila del alféizar (la de abajo del todo) */
  sill: number
  /** Hojas de cristal separadas por parteluces */
  panes: number
}

/** Grosor del marco, en píxeles de arte */
const FRAME_WIDTH = 3
/** Altura del horizonte sobre el cristal de abajo */
const HORIZON = 13
/** Altura del travesaño sobre el alféizar */
const TRANSOM = 56
/** Filas del cielo que ocupa cada tono, desde el horizonte */
const SKY_BAND = 18

export function bigWindow(pix: Pixmap, rng: Rng, p: WindowPalette, s: WindowSpec) {
  const { x, top, width, sill } = s
  const glass = { x: x + FRAME_WIDTH, y: top + FRAME_WIDTH, w: width - 2 * FRAME_WIDTH, bottom: sill - 3 }
  pix.rect(x, top, width, sill - top, p.frame[1])
  pix.rect(x, top, 1, sill - top, p.frame[2])
  pix.rect(x + width - 1, top, 1, sill - top, p.frame[0])
  outsideView(pix, rng, p, glass)
  pix.rect(glass.x, glass.y, glass.w, 1, p.frame[0])
  pix.rect(glass.x, glass.y, 1, glass.bottom - glass.y, p.frame[0])
  for (let i = 1; i < s.panes; i++) {
    const mx = glass.x + Math.round((i * glass.w) / s.panes) - 1
    pix.rect(mx, glass.y, 1, glass.bottom - glass.y, p.frame[2])
    pix.rect(mx + 1, glass.y, 1, glass.bottom - glass.y, p.frame[0])
  }
  const transom = sill - TRANSOM
  if (transom > glass.y + 4) {
    pix.rect(glass.x, transom, glass.w, 1, p.frame[2])
    pix.rect(glass.x, transom + 1, glass.w, 1, p.frame[0])
  }
  pix.rect(x - 2, sill - 2, width + 4, 1, p.frame[3])
  pix.rect(x - 2, sill - 1, width + 4, 1, p.frame[2])
  pix.rect(x - 1, sill, width + 3, 1, p.frame[0])
}

interface Glass {
  x: number
  y: number
  w: number
  bottom: number
}

function outsideView(pix: Pixmap, rng: Rng, p: WindowPalette, g: Glass) {
  const view = new Pixmap(g.w, g.bottom - g.y, false)
  const horizon = view.h - HORIZON
  for (let y = 0; y < view.h; y++) {
    const band = Math.max(0, p.sky.length - 1 - Math.floor((horizon - y) / SKY_BAND))
    view.rect(0, y, view.w, 1, p.sky[band])
  }
  if (rng() < 0.6) cloud(view, rng, p, Math.round(between(rng, 4, view.w - 8)), horizon - Math.round(between(rng, 22, 42)))
  view.rect(0, horizon + 4, view.w, view.h, p.trees[0])
  for (let cx = Math.round(between(rng, -4, 2)); cx < view.w + 6; cx += Math.round(between(rng, 6, 10))) {
    const r = Math.round(between(rng, 4, 7))
    const cy = horizon + Math.round(r * 0.5)
    disc(view, cx, cy, r, p.trees[1])
    disc(view, cx - 1, cy - 1, Math.max(1, r - 3), p.trees[2])
  }
  for (let i = 0; i < 2; i++) glare(view, p.glare, Math.round(between(rng, 2, view.w - 10)), Math.round(between(rng, horizon - 30, horizon - 4)))
  pix.stamp(view, g.x, g.y)
}

function cloud(view: Pixmap, rng: Rng, p: WindowPalette, cx: number, cy: number) {
  const puffs = [[-4, 1, 3], [0, -1, 4], [4, 1, 3]] as const
  for (const [dx, dy, r] of puffs) disc(view, cx + dx, cy + dy + 1, r, p.cloud[0])
  for (const [dx, dy, r] of puffs) disc(view, cx + dx, cy + dy, r, p.cloud[1])
  if (rng() < 0.5) disc(view, cx + 7, cy + 2, 2, p.cloud[1])
}

/** Dos rayas diagonales de reflejo, la segunda más corta */
function glare(view: Pixmap, color: Color, x: number, y: number) {
  for (let k = 0; k < 7; k++) view.set(x + k, y - k, color)
  for (let k = 0; k < 4; k++) view.set(x + 3 + k, y - k, color)
}

// Cosas de la pared de un barco: placa con el número del camarote, aplique de latón encendido, cuadro con un velero
// y salvavidas colgado de su cuerda. Luz arriba a la izquierda y contorno solo en el lado de sombra.

import { disc, insetBox, shadedBox } from '../paint/box'
import { between, type Rng } from '../paint/noise'
import { TRANSPARENT, type Color, type Pixmap } from '../paint/pixmap'
import { paintText, textWidth } from './pixelFont'

/** Latón: contorno, sombra, base, luz y brillo */
type Brass = readonly Color[]

/** Placa de latón con el número del camarote, centrada en `cx` */
export function doorPlate(pix: Pixmap, brass: Brass, cx: number, top: number, number: string) {
  const w = textWidth(number) + 4
  const x = cx - Math.floor(w / 2)
  shadedBox(pix, x, top, w, 9, brass.slice(1, 4))
  pix.rect(x + w, top + 1, 1, 9, brass[0])
  pix.rect(x + 1, top + 9, w, 1, brass[0])
  paintText(pix, number, x + 2, top + 2, brass[0])
}

export interface SconcePalette {
  brass: Brass
  /** Tulipa encendida: borde, base y centro */
  light: readonly Color[]
  /** Halo sobre la pared (semitransparente) */
  glow: Color
}

/** Radio del halo de los apliques */
const GLOW = 9

/** Aplique de pared: halo, tulipa encendida con forma de campana y brazo de latón, con la tulipa en (`cx`, `cy`) */
export function sconce(pix: Pixmap, p: SconcePalette, cx: number, cy: number) {
  for (let dy = -GLOW; dy <= GLOW; dy++)
    for (let dx = -GLOW; dx <= GLOW; dx++) if (dx * dx + dy * dy <= GLOW * GLOW) blend(pix, cx + dx, cy + dy, p.glow)
  pix.rect(cx - 1, cy + 4, 3, 5, p.brass[2])
  pix.rect(cx + 1, cy + 4, 1, 5, p.brass[0])
  pix.rect(cx - 2, cy + 8, 5, 2, p.brass[3])
  pix.rect(cx - 2, cy + 9, 5, 1, p.brass[1])
  const rows = [1, 2, 2, 3, 3]
  rows.forEach((half, i) => {
    pix.rect(cx - half, cy - 1 + i, half * 2 + 1, 1, p.light[1])
    pix.set(cx + half, cy - 1 + i, p.light[0])
  })
  pix.rect(cx - 1, cy + 1, 2, 2, p.light[2])
  pix.rect(cx - 1, cy - 2, 3, 1, p.brass[2])
}

/** Mezcla `color` (semitransparente) con lo que haya: solo sobre lo pintado, para que el halo no tape el fondo */
function blend(pix: Pixmap, x: number, y: number, color: Color) {
  const under = pix.get(x, y)
  if (under === TRANSPARENT) return
  const a = (color >>> 24) / 255
  let out = 0xff000000
  for (const shift of [0, 8, 16]) {
    const c = Math.round(((under >>> shift) & 255) * (1 - a) + ((color >>> shift) & 255) * a)
    out |= c << shift
  }
  pix.set(x, y, out >>> 0)
}

export interface PicturePalette {
  brass: Brass
  sky: readonly Color[]
  sea: readonly Color[]
  /** Vela: sombra y luz */
  sail: readonly Color[]
  /** Casco: contorno y base */
  hull: readonly Color[]
}

/** Cuadro de marco dorado con un velero en el mar */
export function seaPicture(pix: Pixmap, rng: Rng, p: PicturePalette, x: number, top: number, width: number, height: number) {
  shadedBox(pix, x, top, width, height, p.brass.slice(1, 4))
  pix.rect(x + width, top + 1, 1, height, p.brass[0])
  pix.rect(x + 1, top + height, width, 1, p.brass[0])
  const horizon = top + Math.round(height * 0.6)
  insetBox(pix, x + 2, top + 2, width - 4, horizon - top - 2, [p.brass[1], p.sky[2], p.sky[2]])
  pix.rect(x + 3, top + 3, width - 6, Math.round((horizon - top) / 2) - 2, p.sky[1])
  pix.rect(x + 2, horizon, width - 4, top + height - 2 - horizon, p.sea[1])
  pix.rect(x + 2, horizon, width - 4, 1, p.sea[0])
  const boat = x + Math.round(between(rng, 6, width - 10))
  for (let k = 0; k < 6; k++) pix.rect(boat, horizon - 1 - k, Math.max(1, 4 - Math.floor(k / 2)), 1, k < 2 ? p.sail[0] : p.sail[1])
  pix.rect(boat - 1, horizon - 1, 1, 7, p.hull[0])
  pix.rect(boat - 3, horizon, 9, 1, p.hull[1])
  pix.rect(boat - 2, horizon + 1, 7, 1, p.hull[0])
}

export interface LifeRingPalette {
  /** Sombra, rojo, blanco y sombra del blanco */
  ring: readonly Color[]
  /** Cuerda: sombra y luz */
  rope: readonly Color[]
  /** Clavo del que cuelga */
  brass: Brass
}

/** Franjas del salvavidas (rojas y blancas alternas) */
const RING_STRIPES = 8

/** Salvavidas a franjas rojas y blancas de radio `r`, colgado de un clavo por una cuerda que asoma por arriba */
export function lifeRing(pix: Pixmap, p: LifeRingPalette, cx: number, cy: number, r: number) {
  const hole = Math.round(r * 0.5)
  for (let k = 0; k < 3; k++) {
    pix.set(cx - 1 - k, cy - r - 2 + k, p.rope[1])
    pix.set(cx + 1 + k, cy - r - 2 + k, p.rope[0])
  }
  disc(pix, cx, cy - r - 3, 1, p.brass[2])
  pix.set(cx + 1, cy - r - 2, p.brass[0])
  const segment = (Math.PI * 2) / RING_STRIPES
  for (let dy = -r; dy <= r; dy++)
    for (let dx = -r; dx <= r; dx++) {
      const d = Math.sqrt(dx * dx + dy * dy)
      if (d > r + 0.3 || d <= hole) continue
      const white = Math.floor((Math.atan2(dy, dx) + Math.PI + segment / 2) / segment) % 2 === 1
      const shade = (d > r - 1.5 && dx + dy > 0) || (d < hole + 1.5 && dx + dy < 0)
      pix.set(cx + dx, cy + dy, white ? p.ring[shade ? 3 : 2] : p.ring[shade ? 0 : 1])
    }
}

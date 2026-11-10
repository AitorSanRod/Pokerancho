// Piezas de puerto: barandilla de hierro con postes, ancla decorativa, boya a franjas y barca de remos amarrada.
// Luz arriba a la izquierda y contorno solo en el lado de sombra.

import type { Color, Pixmap } from '../paint/pixmap'

/** Barandilla: separación de los postes, alto, grosor del poste y fila del travesaño del medio, en píxeles de arte */
const RAIL = { gap: 22, height: 8, post: 2, middle: 5 }

/** Barandilla a lo ancho de la tesela, apoyada en `baseY`: pasamanos de 2 filas, travesaño y postes. `colors`: contorno, sombra, base y luz */
export function railing(pix: Pixmap, baseY: number, colors: readonly Color[], phase = 0) {
  const [ink, shade, base, light] = colors
  const top = baseY - RAIL.height
  pix.rect(0, top, pix.w, 1, light)
  pix.rect(0, top + 1, pix.w, 1, base)
  pix.rect(0, top + 2, pix.w, 1, ink)
  pix.rect(0, top + RAIL.middle, pix.w, 1, shade)
  for (let x = phase; x < pix.w + phase; x += RAIL.gap) {
    pix.rect(x, top + 1, RAIL.post, RAIL.height - 1, base)
    pix.rect(x, top + 1, 1, RAIL.height - 1, light)
    pix.rect(x + RAIL.post, top + 3, 1, RAIL.height - 3, ink)
  }
}

/** Ancla: argolla, cepo, caña de 2 píxeles y brazos curvos con las uñas hacia arriba (`#` hierro) */
const ANCHOR_SHAPE = [
  '....####....',
  '....#..#....',
  '....####....',
  '.##########.',
  '.....##.....',
  '.....##.....',
  '.....##.....',
  '.....##.....',
  '##...##...##',
  '##...##...##',
  '.##..##..##.',
  '..########..',
  '....####....',
]

/**
 * Ancla de pie con la base en (`cx`, `groundY`). `colors`: contorno, sombra, base y luz; el primer píxel de cada tramo
 * va en luz, el último en sombra y debajo del todo el contorno.
 */
export function anchor(pix: Pixmap, cx: number, groundY: number, colors: readonly Color[]) {
  const [ink, shade, base, light] = colors
  const left = cx - ANCHOR_SHAPE[0].length / 2
  const top = groundY - ANCHOR_SHAPE.length
  const filled = (x: number, y: number) => ANCHOR_SHAPE[y]?.[x] === '#'
  ANCHOR_SHAPE.forEach((line, y) =>
    [...line].forEach((_, x) => {
      if (!filled(x, y)) return
      const color = !filled(x - 1, y) ? light : !filled(x + 1, y) ? shade : base
      pix.set(left + x, top + y, color)
      if (!filled(x, y + 1) && !filled(x + 1, y + 1)) pix.set(left + x + 1, top + y + 1, ink)
    }),
  )
}

export interface BuoyPalette {
  red: readonly Color[]
  white: readonly Color[]
}

/** Boya redonda de franjas rojas y blancas con un mástil corto y su luz, apoyada en `baseY` */
export function buoy(pix: Pixmap, cx: number, baseY: number, r: number, p: BuoyPalette) {
  const cy = baseY - r
  for (let dy = -r; dy <= r; dy++)
    for (let dx = -r; dx <= r; dx++) {
      if (Math.hypot(dx, dy) > r + 0.3) continue
      const white = Math.floor((dy + r) / Math.max(2, r * 0.6)) % 2 === 1
      const lit = dx + dy < -r * 0.4
      const dark = dx + dy > r * 0.6
      pix.set(cx + dx, cy + dy, white ? p.white[dark ? 0 : 1] : p.red[dark ? 0 : lit ? 2 : 1])
    }
  pix.rect(cx, cy - r - 3, 1, 3, p.white[0])
  pix.set(cx, cy - r - 4, p.red[2])
}

export interface BoatPalette {
  hull: readonly Color[]
  rim: readonly Color[]
  ink: Color
}

/** Barca de remos vista de lado: casco que se estrecha abajo, borda clara, con la línea del agua en `waterY` */
export function rowboat(pix: Pixmap, cx: number, waterY: number, length: number, p: BoatPalette) {
  const depth = Math.max(4, Math.round(length / 5))
  const half = Math.round(length / 2)
  for (let y = 0; y < depth; y++) {
    const inset = Math.round((y * y) / depth)
    const left = cx - half + inset
    const right = cx + half - inset
    pix.rect(left, waterY - depth + y + 1, right - left, 1, y === 0 ? p.rim[1] : y === 1 ? p.rim[0] : p.hull[y < depth - 1 ? 1 : 0])
    pix.set(left, waterY - depth + y + 1, y < 2 ? p.rim[1] : p.hull[2])
    pix.set(right, waterY - depth + y + 1, p.ink)
  }
}

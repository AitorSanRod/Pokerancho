// Piezas de Monte Moon: fósiles incrustados en la pared (caracola en espiral y espina de pez) y Piedras Lunares junto
// al camino. Luz arriba a la izquierda; contorno en la sombra.

import { between, type Rng } from '../../paint/noise'
import { Pixmap, type Color } from '../../paint/pixmap'
import { FOSSIL, MOON_STONE } from './palette'

/** Caracola fósil en espiral (como la de un Omanyte) de `r` píxeles de radio, con centro en (cx, cy) */
export function spiralFossil(pix: Pixmap, cx: number, cy: number, r: number, ink: Color) {
  for (let a = 0; a < Math.PI * 5; a += 0.08) {
    const d = (r * a) / (Math.PI * 5)
    const x = Math.round(cx + Math.cos(a) * d)
    const y = Math.round(cy + Math.sin(a) * d * 0.9)
    pix.set(x, y, Math.sin(a) > 0.3 ? FOSSIL[0] : Math.cos(a) < -0.3 ? FOSSIL[2] : FOSSIL[1])
    pix.set(x + 1, y + 1, ink)
  }
}

/** Espina de pez fósil de `length` píxeles, tumbada, con la cabeza a la izquierda */
export function boneFossil(pix: Pixmap, x: number, y: number, length: number, ink: Color) {
  pix.rect(x, y - 1, 3, 3, FOSSIL[1])
  pix.set(x, y - 1, FOSSIL[2])
  for (let i = 3; i < length; i++) {
    pix.set(x + i, y, FOSSIL[1])
    pix.set(x + i, y + 1, ink)
    if (i % 3 === 0 && i < length - 2) {
      const rib = Math.max(1, Math.round(3 * (1 - i / length)) + 1)
      for (let k = 1; k <= rib; k++) {
        pix.set(x + i - k + 1, y - k, FOSSIL[2])
        pix.set(x + i - k + 1, y + k, FOSSIL[0])
      }
    }
  }
  pix.set(x + length, y - 1, FOSSIL[1])
  pix.set(x + length, y + 1, FOSSIL[1])
}

/** Dónde caen las motas doradas de la Piedra Lunar, en fracciones de su semiancho y semialto */
const SPECKS: [number, number][] = [[0.35, -0.35], [-0.1, 0.3], [0.55, 0.15], [0.15, 0.6]]

/** Piedra Lunar: canto rodado oscuro con una luna clara y motas doradas, apoyada en `groundY` */
export function moonStone(pix: Pixmap, rng: Rng, cx: number, groundY: number, size: number) {
  const [dark, base, light] = MOON_STONE.colors
  const rx = size / 2
  const ry = size * 0.38
  const cy = groundY - ry
  for (let y = Math.floor(cy - ry); y <= groundY; y++)
    for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
      const u = (x - cx) / rx
      const v = (y - cy) / ry
      const d = u * u + v * v
      if (d > 1) continue
      const edge = d > 0.78 && (u > 0.1 || v > 0.2)
      pix.set(x, y, edge ? MOON_STONE.ink : u + v < -0.7 ? light : u + v > 0.5 ? dark : base)
    }
  for (let a = -1.2; a < 1.4; a += 0.15) pix.set(Math.round(cx - rx * 0.15 + Math.cos(a + 1.6) * rx * 0.45), Math.round(cy + Math.sin(a + 1.6) * ry * 0.45), light)
  // Motas sueltas a alturas distintas (dos a la par parecerían unos ojos)
  SPECKS.forEach(([u, v]) => pix.set(Math.round(cx + u * rx + between(rng, -1, 1)), Math.round(cy + v * ry), MOON_STONE.speck))
}

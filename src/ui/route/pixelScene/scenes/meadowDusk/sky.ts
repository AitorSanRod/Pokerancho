// Cielo del atardecer y el sol bajo, medio escondido tras las colinas lejanas.

import { Pixmap, rgba } from '../../paint/pixmap'
import { verticalGradient } from '../../paint/shade'
import { DUSK_SKY, HORIZON_GLOW, SUN, SUN_HALO } from './palette'

/** Altura sobre el borde inferior donde el cielo llega a su tono más claro (detrás de las colinas) */
const HORIZON = 130
/** Ancho de la tesela del sol: con parallax 0 se ve siempre en el mismo sitio */
const SUN_TILE = { width: 420, height: 64 }
/** Centro del sol dentro de su tesela y radio, en píxeles de arte */
const SUN_DISC = { x: 104, y: 32, r: 11 }
/** Anillos del halo: radio y opacidad, de dentro afuera */
const HALO_RINGS = [
  [16, 0.4],
  [22, 0.22],
  [29, 0.1],
] as const

export function duskSky(height: number): Pixmap {
  const pix = new Pixmap(16, height)
  verticalGradient(pix, DUSK_SKY, 0, Math.max(2, height - HORIZON), 0)
  pix.rect(0, height - HORIZON, 16, HORIZON, HORIZON_GLOW)
  return pix
}

/** Sol redondo de tres tonos (más claro arriba a la izquierda) con un halo en anillos semitransparentes */
export function sun(): Pixmap {
  const pix = new Pixmap(SUN_TILE.width, SUN_TILE.height)
  const { x: cx, y: cy, r } = SUN_DISC
  const outer = HALO_RINGS[HALO_RINGS.length - 1][0]
  for (let y = cy - outer; y <= cy + outer; y++)
    for (let x = cx - outer; x <= cx + outer; x++) {
      const d = Math.hypot(x - cx + 0.5, y - cy + 0.5)
      if (d <= r) pix.set(x, y, SUN[sunTone(x - cx, y - cy, d, r)])
      else {
        const ring = HALO_RINGS.find(([radius]) => d <= radius)
        if (ring) pix.set(x, y, rgba(SUN_HALO, ring[1]))
      }
    }
  return pix
}

/** Borde en el anillo exterior; centro claro desplazado hacia la luz (arriba a la izquierda) */
function sunTone(dx: number, dy: number, d: number, r: number): number {
  if (d > r - 1.5) return 0
  return Math.hypot(dx + r * 0.25, dy + r * 0.25) < r * 0.6 ? 2 : 1
}

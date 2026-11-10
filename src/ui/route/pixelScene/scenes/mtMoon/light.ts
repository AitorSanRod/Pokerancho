// Luz de los cristales: la roca de alrededor de cada cristal sube de tono por bandas (colores planos, sin halos
// semitransparentes). Se pinta primero la roca normal y después `relight` cambia sus tonos según la luz.

import { valueNoise } from '../../paint/noise'
import type { Color, Pixmap } from '../../paint/pixmap'

/** Un cristal que alumbra: centro y alcance, en píxeles de arte de la tesela */
export interface Light {
  x: number
  y: number
  r: number
}

/** Tonos que sube la roca en el centro de una luz */
const LIGHT_STEPS = 3
/** Tamaño de las manchas del borde de la luz (divide el ancho de todas las teselas que se alumbran) */
const LIGHT_NOISE_CELL = 20
/** Cuánto deforma el ruido el borde de la luz, para que no sea un círculo perfecto */
const EDGE_NOISE = 0.15

/** Brillo de 0 a 1 en (x, y), con la distancia medida dando la vuelta a la tesela */
function brightness(lights: readonly Light[], x: number, y: number, w: number): number {
  let best = 0
  for (const l of lights) {
    const dx = Math.min(Math.abs(x - l.x), w - Math.abs(x - l.x))
    best = Math.max(best, 1 - Math.hypot(dx, (y - l.y) * 1.2) / l.r)
  }
  return best
}

/**
 * Sube de tono los píxeles iluminados de una roca: los que tienen un color de `colors` pasan hasta `LIGHT_STEPS` tonos
 * más arriba en `colors` + `lit` (el último de `lit` solo en el centro). El contorno y lo demás no cambian.
 */
export function relight(pix: Pixmap, rock: { colors: readonly Color[]; lit: readonly Color[] }, lights: readonly Light[], seed: number) {
  const tones = [...rock.colors, ...rock.lit]
  const index = new Map(rock.colors.map((c, i) => [c, i]))
  for (let y = 0; y < pix.h; y++)
    for (let x = 0; x < pix.w; x++) {
      const i = index.get(pix.get(x, y))
      if (i === undefined) continue
      const light = brightness(lights, x, y, pix.w) + (valueNoise(x, y, LIGHT_NOISE_CELL, pix.w, seed) - 0.5) * EDGE_NOISE
      const steps = Math.floor(Math.max(0, light) * (LIGHT_STEPS + 1))
      if (steps > 0) pix.set(x, y, tones[Math.min(tones.length - 1, i + steps)])
    }
}

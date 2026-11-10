// Tienda: una casa del pueblo con un toldo a rayas sobre la planta baja, de borde ondulado y con su sombra en la
// pared.

import type { Color, Pixmap } from '../paint/pixmap'
import { house, type HousePalette } from './house'

export interface ShopPalette {
  house: HousePalette
  awning: {
    /** Rayas alternas: color y blanco */
    stripes: readonly Color[]
    /** Sombra de cada raya (mismo orden) */
    shade: readonly Color[]
  }
}

/** Medidas a escala 1, en píxeles de arte: ancho de la casa, alto del tejado, alero, sombra del alero, toldo y raya */
const BASE = { width: 80, roof: 22, overhang: 4, eave: 3, awning: 8, stripe: 5 }

/** Toldo de `x` a `x + width` bajo `top`: rayas verticales, canto en sombra arriba y faldón ondulado abajo */
function awning(pix: Pixmap, p: ShopPalette['awning'], x: number, top: number, width: number, height: number, stripe: number) {
  for (let k = 0; k < width; k++) {
    const i = Math.floor(k / stripe) % 2
    const inStripe = k % stripe
    const scallop = inStripe === 0 || inStripe === stripe - 1 ? 1 : 0
    pix.set(x + k, top, p.shade[i])
    pix.rect(x + k, top + 1, 1, height - 1 - scallop, k > width - 3 ? p.shade[i] : p.stripes[i])
    pix.set(x + k, top + height - scallop, p.shade[1])
  }
}

export function shop(p: ShopPalette, scale = 1): Pixmap {
  const s = (n: number) => Math.max(2, Math.round(n * scale))
  const pix = house(p.house, BASE.width, scale)
  const overhang = s(BASE.overhang)
  awning(pix, p.awning, overhang - 2, s(BASE.roof) + s(BASE.eave) - 1, pix.w - overhang * 2 + 4, s(BASE.awning), s(BASE.stripe))
  return pix
}

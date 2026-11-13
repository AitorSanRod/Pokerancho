// Barco de pasajeros grande, visto de lado y amarrado: casco con franja a ras de agua, dos cubiertas con ventanas,
// puente de mando hacia proa y dos chimeneas. Luz arriba a la izquierda, contorno en la sombra.

import type { Color, Pixmap } from '../paint/pixmap'

export interface LinerPalette {
  /** Casco: contorno, sombra, base y luz */
  hull: readonly Color[]
  /** Franja del casco y de las chimeneas: sombra y base */
  stripe: readonly Color[]
  /** Cubiertas blancas: contorno, sombra, base y luz */
  deck: readonly Color[]
  /** Ojos de buey y ventanas */
  glass: Color
  /** Chimeneas: sombra, base y remate oscuro */
  funnel: readonly Color[]
}

/** Medidas en píxeles de arte: eslora, alto del casco, de cada cubierta, de las chimeneas y largo de la proa curva */
const SHIP = { length: 96, hull: 11, deck: 6, funnel: 9, bow: 14 }

/** Casco: la proa (derecha) sube en curva y la popa (izquierda) se recoge abajo; franja a ras de agua */
function hull(pix: Pixmap, p: LinerPalette, x0: number, waterY: number) {
  const top = waterY - SHIP.hull
  for (let i = 0; i < SHIP.length; i++) {
    const bow = Math.max(0, i - (SHIP.length - SHIP.bow))
    const colTop = top - Math.round((bow * bow) / 40)
    const colBottom = waterY - Math.round(bow * 0.6) - (i < 3 ? 3 - i : 0)
    if (colBottom <= colTop) continue
    pix.rect(x0 + i, colTop, 1, colBottom - colTop, i > SHIP.length - 6 ? p.hull[1] : p.hull[2])
    pix.set(x0 + i, colTop, p.hull[3])
    pix.rect(x0 + i, colBottom - 3, 1, 2, p.stripe[1])
    pix.set(x0 + i, colBottom - 1, p.hull[0])
  }
  for (let i = 8; i < SHIP.length - SHIP.bow; i += 7) pix.set(x0 + i, top + 3, p.glass)
}

/** Cubierta blanca de `from` a `to` con una fila de ventanas; contorno a la derecha y abajo */
function deck(pix: Pixmap, p: LinerPalette, from: number, to: number, bottom: number) {
  const top = bottom - SHIP.deck
  pix.rect(from, top, to - from, SHIP.deck, p.deck[2])
  pix.rect(from, top, to - from, 1, p.deck[3])
  pix.rect(from, bottom - 1, to - from, 1, p.deck[1])
  pix.rect(to - 1, top, 1, SHIP.deck, p.deck[0])
  for (let x = from + 3; x < to - 3; x += 4) pix.rect(x, top + 2, 2, 2, p.glass)
}

/** Chimenea inclinada hacia popa, con su franja y el remate oscuro */
function funnel(pix: Pixmap, p: LinerPalette, x: number, baseY: number) {
  for (let i = 0; i < SHIP.funnel; i++) {
    const lean = Math.floor(i / 3)
    const cap = i > SHIP.funnel - 3
    pix.rect(x - lean, baseY - 1 - i, 6, 1, cap ? p.funnel[2] : i > 3 && i < 6 ? p.stripe[1] : p.funnel[1])
    pix.set(x - lean + 5, baseY - 1 - i, cap ? p.funnel[2] : p.funnel[0])
  }
}

/** Barco con la línea de flotación en `waterY` y la popa en `x0` */
export function liner(pix: Pixmap, p: LinerPalette, x0: number, waterY: number) {
  hull(pix, p, x0, waterY)
  const deck1 = waterY - SHIP.hull
  deck(pix, p, x0 + 8, x0 + SHIP.length - 18, deck1)
  deck(pix, p, x0 + 16, x0 + SHIP.length - 30, deck1 - SHIP.deck)
  const bridge = deck1 - SHIP.deck * 2
  deck(pix, p, x0 + SHIP.length - 46, x0 + SHIP.length - 32, bridge)
  for (const at of [26, 42]) funnel(pix, p, x0 + at, bridge + SHIP.deck)
}

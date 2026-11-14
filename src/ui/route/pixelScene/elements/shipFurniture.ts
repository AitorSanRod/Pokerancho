// Muebles de barco: banco de madera con respaldo y cojín, y maletas apiladas con correas y asa. Luz arriba a la
// izquierda y contorno solo en el lado de sombra.

import { shadedBox } from '../paint/box'
import { between, pick, type Rng } from '../paint/noise'
import type { Color, Pixmap } from '../paint/pixmap'

export interface ShipFurniturePalette {
  /** Madera: contorno, sombra, base y luz */
  wood: readonly Color[]
  /** Cojín: sombra, base y luz */
  cushion: readonly Color[]
  /** Maletas: cada una, sombra, base y luz */
  luggage: readonly (readonly Color[])[]
  /** Latón de las correas: contorno, sombra, base */
  brass: readonly Color[]
}

/** Banco de `width` apoyado en `groundY`: respaldo con dos postes, cojín y patas */
export function bench(pix: Pixmap, p: ShipFurniturePalette, x: number, groundY: number, width: number) {
  const wood = p.wood.slice(1)
  const seat = groundY - 8
  shadedBox(pix, x + 1, seat - 16, width - 2, 4, wood)
  for (const px of [x + 2, x + width - 5]) {
    pix.rect(px, seat - 13, 3, 13, p.wood[2])
    pix.rect(px, seat - 13, 1, 13, p.wood[3])
    pix.rect(px + 2, seat - 13, 1, 13, p.wood[0])
  }
  shadedBox(pix, x + 4, seat - 12, width - 8, 9, p.cushion)
  shadedBox(pix, x, seat - 3, width, 4, p.cushion)
  shadedBox(pix, x, seat + 1, width, 2, wood)
  for (const px of [x + 2, x + width - 4]) {
    pix.rect(px, seat + 3, 2, groundY - seat - 2, p.wood[1])
    pix.set(px + 1, groundY, p.wood[0])
  }
}

/** Dos o tres maletas apiladas desde `groundY`, la de abajo de `width` y las de encima más pequeñas */
export function luggageStack(pix: Pixmap, rng: Rng, p: ShipFurniturePalette, x: number, groundY: number, width: number, count: number) {
  let bottom = groundY
  let w = width
  for (let i = 0; i < count; i++) {
    const height = Math.round(between(rng, 7, 11)) - i
    const left = x + Math.round((width - w) / 2 + between(rng, -2, 2))
    suitcase(pix, p, pick(rng, p.luggage), left, bottom - height + 1, w, height)
    bottom -= height
    w = Math.round(w * between(rng, 0.72, 0.86))
  }
}

function suitcase(pix: Pixmap, p: ShipFurniturePalette, tones: readonly Color[], x: number, top: number, width: number, height: number) {
  shadedBox(pix, x, top, width, height, tones)
  pix.rect(x + width, top + 1, 1, height, p.wood[0])
  for (const sx of [x + 4, x + width - 6]) {
    pix.rect(sx, top, 2, height, p.brass[2])
    pix.rect(sx + 1, top, 1, height, p.brass[1])
  }
  const handle = x + Math.floor(width / 2) - 2
  pix.rect(handle, top - 2, 5, 1, p.wood[0])
  pix.set(handle, top - 1, p.wood[0])
  pix.set(handle + 4, top - 1, p.wood[0])
}

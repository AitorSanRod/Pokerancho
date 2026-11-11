// Puertas de interior apoyadas en el suelo de la pared: de madera con cuarterones y ventanuco, o automática de
// cristal con sensor encima. Las dos con su marco (jamba) y luz arriba a la izquierda.

import { insetBox, shadedBox } from '../paint/box'
import type { Color, Pixmap } from '../paint/pixmap'

export interface DoorPalette {
  /** Jamba: sombra, base, luz y brillo */
  frame: readonly Color[]
  /** Madera: contorno, sombra, base y luz */
  wood: readonly Color[]
  /** Cristal: sombra, base y luz */
  glass: readonly Color[]
  /** Metal: contorno, sombra, base, luz y brillo */
  metal: readonly Color[]
  /** Pomo: sombra y luz */
  brass: readonly Color[]
  /** Piloto del sensor */
  led: Color
}

/** Grosor de la jamba, en píxeles de arte */
const JAMB = 2

function jamb(pix: Pixmap, frame: readonly Color[], x: number, top: number, width: number, height: number) {
  pix.rect(x - JAMB, top - JAMB, width + 2 * JAMB, height + JAMB, frame[1])
  pix.rect(x - JAMB, top - JAMB, width + 2 * JAMB, 1, frame[3])
  pix.rect(x - JAMB, top - JAMB, 1, height + JAMB, frame[2])
  pix.rect(x + width + JAMB - 1, top - JAMB, 1, height + JAMB, frame[0])
}

/** Puerta de madera de `width`×`height` cuya fila de abajo es `groundY` */
export function woodDoor(pix: Pixmap, p: DoorPalette, x: number, groundY: number, width: number, height: number) {
  const top = groundY - height + 1
  const wood = p.wood.slice(1)
  jamb(pix, p.frame, x, top, width, height)
  shadedBox(pix, x, top, width, height, wood)
  pix.rect(x, top + height - 1, width, 1, p.wood[0])
  const upper = Math.round(height * 0.32)
  insetBox(pix, x + 3, top + 4, width - 6, upper, p.glass)
  pix.rect(x + 4, top + 5, 1, upper - 3, p.glass[2])
  insetBox(pix, x + 3, top + upper + 7, width - 6, height - upper - 12, wood)
  const knobY = top + Math.round(height * 0.56)
  pix.rect(x + width - 5, knobY, 2, 2, p.brass[1])
  pix.set(x + width - 4, knobY + 1, p.brass[0])
}

/** Puerta automática de cristal, de dos hojas, con el sensor encima */
export function glassDoor(pix: Pixmap, p: DoorPalette, x: number, groundY: number, width: number, height: number) {
  const top = groundY - height + 1
  const metal = p.metal.slice(1, 4)
  jamb(pix, p.frame, x, top, width, height)
  const half = Math.floor(width / 2)
  for (const [lx, lw] of [[x, half], [x + half, width - half]] as const) {
    shadedBox(pix, lx, top, lw, height, metal)
    insetBox(pix, lx + 2, top + 2, lw - 4, height - 8, p.glass)
    pix.rect(lx + 3, top + 3, lw - 6, height - 11, p.glass[1])
    for (let k = 0; k < 6; k++) pix.set(lx + 4 + k, top + 14 - k, p.glass[2])
    for (let k = 0; k < 3; k++) pix.set(lx + 6 + k, top + 14 - k, p.glass[2])
  }
  pix.rect(x + half - 1, top, 1, height, p.metal[0])
  pix.rect(x, groundY, width, 1, p.metal[0])
  const sensorX = x + half - 5
  shadedBox(pix, sensorX, top - JAMB - 4, 10, 4, metal)
  pix.set(sensorX + 7, top - JAMB - 2, p.led)
}

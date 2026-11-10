// Casa del pescador: casita baja de tablones con tejado de pizarra, puerta y ventanuco, un salvavidas colgado y una
// red de pesca tendida en la pared, con flotadores arriba y el borde de abajo combado.

import { Pixmap, type Color } from '../paint/pixmap'

export interface FisherHutPalette {
  /** Tablones: junta, sombra, base y luz */
  wood: readonly Color[]
  ink: Color
  /** Pizarra del tejado: sombra, base y luz */
  roof: readonly Color[]
  roofInk: Color
  /** Cristal: marco, base y reflejo */
  glass: readonly Color[]
  /** Red: sombra y cuerda */
  net: readonly Color[]
  /** Salvavidas: sombra, rojo y blanco */
  ring: readonly Color[]
}

/** Medidas a escala 1, en píxeles de arte */
const BASE = { width: 66, roof: 18, wall: 28, overhang: 4, plank: 4, door: [11, 17], window: 8, ring: 5, net: [20, 15], mesh: 4 }
/** Lo que entra cada fila del tejado por cada fila que sube */
const ROOF_SLOPE = 0.6

function roof(pix: Pixmap, p: FisherHutPalette, height: number) {
  for (let y = 0; y < height; y++) {
    const inset = Math.round((height - 1 - y) * ROOF_SLOPE)
    const tone = y % 3 === 2 ? 0 : y === 0 ? 2 : 1
    pix.rect(inset, y, pix.w - inset * 2, 1, p.roof[tone])
    pix.set(inset + 1, y, p.roof[2])
    pix.set(pix.w - inset - 1, y, p.roofInk)
  }
  pix.rect(0, height - 1, pix.w, 1, p.roofInk)
}

/** Pared de tablones horizontales con juntas a tramos, más clara a la izquierda */
function planks(pix: Pixmap, p: FisherHutPalette, x: number, top: number, width: number, height: number, plank: number) {
  for (let y = top; y < top + height; y++)
    for (let k = 0; k < width; k++) {
      const row = Math.floor((y - top) / plank)
      const seam = (y - top) % plank === 0 || (k + row * 11) % 23 === 0
      pix.set(x + k, y, seam ? p.wood[0] : k < 3 ? p.wood[3] : k > width - 4 ? p.wood[1] : p.wood[2])
    }
  pix.rect(x + width, top, 1, height, p.ink)
  pix.rect(x, top + height - 1, width + 1, 1, p.ink)
}

/** Salvavidas: aro de cuatro tramos rojos y blancos */
function lifeRing(pix: Pixmap, p: FisherHutPalette, cx: number, cy: number, r: number) {
  for (let dy = -r; dy <= r; dy++)
    for (let dx = -r; dx <= r; dx++) {
      const d = Math.hypot(dx, dy)
      if (d > r + 0.3 || d < r * 0.45) continue
      const white = Math.abs(dx) < r * 0.35 || Math.abs(dy) < r * 0.35
      pix.set(cx + dx, cy + dy, dx + dy > r * 0.6 ? p.ring[0] : white ? p.ring[2] : p.ring[1])
    }
}

/** Red tendida: malla de rombos que cuelga combada desde `top`, con flotadores rojos en la cuerda de arriba */
function net(pix: Pixmap, p: FisherHutPalette, x: number, top: number, width: number, height: number, mesh: number) {
  for (let k = 0; k <= width; k++) {
    const u = k / width
    const sag = Math.round(height * (0.75 + 0.25 * Math.sin(Math.PI * u)))
    for (let y = 1; y <= sag; y++) if ((k + y) % mesh === 0 || (k - y + mesh * 20) % mesh === 0) pix.set(x + k, top + y, p.net[1])
    pix.set(x + k, top + sag + 1, p.net[0])
    pix.set(x + k, top, p.net[1])
  }
  for (let k = 2; k < width; k += mesh * 2) pix.rect(x + k, top - 1, 2, 2, p.ring[1])
}

export function fisherHut(p: FisherHutPalette, scale = 1): Pixmap {
  const s = (n: number) => Math.max(2, Math.round(n * scale))
  const [width, roofH, wall, overhang] = [s(BASE.width), s(BASE.roof), s(BASE.wall), s(BASE.overhang)]
  const pix = new Pixmap(width, roofH + wall, false)
  planks(pix, p, overhang, roofH, width - overhang * 2 - 1, wall, Math.max(3, s(BASE.plank)))
  roof(pix, p, roofH)
  const bottom = pix.h - 1
  const [dw, dh] = [s(BASE.door[0]), s(BASE.door[1])]
  const doorX = overhang + s(6)
  pix.rect(doorX, bottom - dh, dw, dh, p.wood[0])
  pix.rect(doorX + 1, bottom - dh + 1, dw - 2, dh - 1, p.wood[1])
  pix.rect(doorX + 1, bottom - dh + 1, 1, dh - 1, p.wood[2])
  const win = s(BASE.window)
  const winX = doorX + dw + s(5)
  pix.rect(winX - 1, roofH + s(5) - 1, win + 2, win + 2, p.wood[0])
  pix.rect(winX, roofH + s(5), win, win, p.glass[1])
  pix.rect(winX, roofH + s(5), 2, 2, p.glass[2])
  lifeRing(pix, p, doorX + Math.round(dw / 2), roofH + s(6), s(BASE.ring))
  const [nw, nh] = [s(BASE.net[0]), s(BASE.net[1])]
  net(pix, p, width - overhang - nw - s(3), roofH + s(4), nw, nh, Math.max(3, s(BASE.mesh)))
  return pix
}

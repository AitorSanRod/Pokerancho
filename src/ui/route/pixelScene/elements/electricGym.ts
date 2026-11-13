// Gimnasio eléctrico: nave de paneles metálicos con un tejado plano y grueso, franja amarilla bajo el alero,
// ventanas alargadas, puerta corredera de cristal, pararrayos con chispa y un cartel redondo con un rayo.

import { Pixmap, type Color } from '../paint/pixmap'

export interface ElectricGymPalette {
  /** Paneles de la pared: junta, sombra, base y luz */
  wall: readonly Color[]
  ink: Color
  /** Tejado: sombra, base y luz */
  roof: readonly Color[]
  roofInk: Color
  /** Amarillo eléctrico: sombra, base y brillo (franja, rayo, chispa) */
  bolt: readonly Color[]
  /** Disco del cartel: borde y fondo */
  plate: readonly Color[]
  /** Cristal: marco, base y reflejo */
  glass: readonly Color[]
}

/** Medidas a escala 1, en píxeles de arte */
const BASE = { width: 104, wall: 34, roof: 9, eave: 3, panel: 8, door: [20, 22], window: [16, 7], plate: 9, rod: 14 }

/** Rayo del cartel: `#` amarillo, `s` su sombra (lado derecho) */
const BOLT = ['...##s', '..##s.', '.##s..', '#####s', '..##s.', '.##s..', '##s...', '#s....']

/** Paneles verticales con juntas; más claros a la izquierda, contorno a la derecha y abajo */
function panels(pix: Pixmap, p: ElectricGymPalette, top: number, height: number, panel: number) {
  for (let x = 0; x < pix.w; x++) {
    const tone = x % panel === 0 ? p.wall[0] : x < pix.w * 0.3 ? p.wall[3] : x % panel === panel - 1 ? p.wall[1] : p.wall[2]
    pix.rect(x, top, 1, height, tone)
  }
  pix.rect(pix.w - 1, top, 1, height, p.ink)
  pix.rect(0, top + height - 1, pix.w, 1, p.ink)
}

/** Tejado plano con su canto iluminado y, debajo, la franja amarilla del alero */
function roof(pix: Pixmap, p: ElectricGymPalette, top: number, height: number, eave: number) {
  pix.rect(0, top, pix.w, height, p.roof[1])
  pix.rect(0, top, pix.w, 1, p.roof[2])
  pix.rect(0, top + height - 2, pix.w, 1, p.roof[0])
  pix.rect(0, top + height - 1, pix.w, 1, p.roofInk)
  pix.rect(2, top + height, pix.w - 4, eave, p.bolt[1])
  pix.rect(2, top + height + eave - 1, pix.w - 4, 1, p.bolt[0])
}

function framedGlass(pix: Pixmap, p: ElectricGymPalette, x: number, y: number, w: number, h: number) {
  pix.rect(x - 1, y - 1, w + 2, h + 2, p.glass[0])
  pix.rect(x, y, w, h, p.glass[1])
  pix.rect(x + 1, y + 1, Math.max(1, Math.round(w / 3)), 1, p.glass[2])
  pix.rect(x + w + 1, y - 1, 1, h + 2, p.ink)
}

/** Puerta corredera de dos hojas con marco amarillo */
function door(pix: Pixmap, p: ElectricGymPalette, cx: number, bottom: number, w: number, h: number) {
  const x = Math.round(cx - w / 2)
  pix.rect(x - 2, bottom - h - 2, w + 4, h + 2, p.bolt[1])
  pix.rect(x + w + 1, bottom - h - 2, 1, h + 2, p.bolt[0])
  framedGlass(pix, p, x, bottom - h, w, h - 1)
  pix.rect(Math.round(cx), bottom - h, 1, h - 1, p.glass[0])
}

/** Cartel redondo con el rayo, centrado en (`cx`, `cy`) */
function plate(pix: Pixmap, p: ElectricGymPalette, cx: number, cy: number, r: number) {
  for (let dy = -r; dy <= r; dy++)
    for (let dx = -r; dx <= r; dx++) {
      const d = Math.hypot(dx, dy)
      if (d <= r + 0.3) pix.set(cx + dx, cy + dy, d > r - 1 ? (dx + dy > 0 ? p.ink : p.plate[0]) : p.plate[1])
    }
  const [w, h] = [BOLT[0].length, BOLT.length]
  BOLT.forEach((row, y) =>
    [...row].forEach((c, x) => {
      if (c !== '.') pix.set(cx - Math.floor(w / 2) + x, cy - Math.floor(h / 2) + y, c === '#' ? p.bolt[1] : p.bolt[0])
    }),
  )
}

/** Pararrayos en el tejado con una chispa en la punta */
function rod(pix: Pixmap, p: ElectricGymPalette, x: number, roofTop: number, height: number) {
  pix.rect(x, roofTop - height, 1, height, p.roofInk)
  pix.rect(x - 1, roofTop - 2, 3, 2, p.roof[0])
  const tip = roofTop - height - 1
  pix.set(x, tip, p.bolt[2])
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1]]) pix.set(x + dx, tip + dy, p.bolt[1])
}

/** Gimnasio a `scale` (1 = 104 píxeles de ancho) */
export function electricGym(p: ElectricGymPalette, scale = 1): Pixmap {
  const s = (n: number) => Math.max(2, Math.round(n * scale))
  const [width, wall, roofH, eave, r, rodH] = [s(BASE.width), s(BASE.wall), s(BASE.roof), s(BASE.eave), s(BASE.plate), s(BASE.rod)]
  const roofTop = Math.max(rodH + 2, r - Math.round(roofH / 2) + 2)
  const pix = new Pixmap(width, roofTop + roofH + wall, false)
  const wallTop = roofTop + roofH
  panels(pix, p, wallTop, wall, s(BASE.panel))
  roof(pix, p, roofTop, roofH, eave)
  const cx = Math.round(width / 2)
  door(pix, p, cx, pix.h - 1, s(BASE.door[0]), s(BASE.door[1]))
  const [ww, wh] = [s(BASE.window[0]), s(BASE.window[1])]
  const windowY = wallTop + eave + Math.round((wall - eave - wh) * 0.35)
  for (const at of [0.17, 0.83]) framedGlass(pix, p, Math.round(width * at - ww / 2), windowY, ww, wh)
  plate(pix, p, cx, roofTop + Math.round(roofH / 2) - 2, r)
  rod(pix, p, Math.round(width * 0.85), roofTop, rodH)
  return pix
}

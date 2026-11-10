// Gimnasio acuático: cuerpo bajo de azulejo claro con un friso de olas arriba, gran cúpula turquesa con nervios,
// ventanas redondas como ojos de buey, puerta de cristal y un emblema de gota sobre la entrada.

import { Pixmap, type Color } from '../paint/pixmap'
import { ramp } from '../paint/shade'

export interface WaterGymPalette {
  /** Azulejo: sombra, base, luz y brillo */
  wall: readonly Color[]
  ink: Color
  /** Cúpula: 5 tonos de oscuro a claro */
  dome: readonly Color[]
  /** Friso de olas: oscuro, base y espuma */
  wave: readonly Color[]
  /** Cristal: marco, base y reflejo */
  glass: readonly Color[]
  /** Emblema: disco, gota (sombra y base) y brillo */
  emblem: readonly Color[]
}

/** Medidas a escala 1, en píxeles de arte */
const BASE = { width: 112, wall: 34, dome: [80, 30], frieze: 6, door: [20, 22], porthole: 5, emblem: 7, tile: 6 }
/** Nervios de la cúpula, en fracción del semiancho desde el centro */
const RIBS = [-0.5, 0, 0.5]

/** Cúpula: media elipse iluminada arriba a la izquierda, con nervios en sombra y contorno en el lado derecho */
function dome(pix: Pixmap, p: WaterGymPalette, cx: number, baseY: number, a: number, b: number) {
  for (let y = baseY - b; y < baseY; y++) {
    const ny = (baseY - y) / b
    const half = a * Math.sqrt(Math.max(0, 1 - ny * ny))
    for (let x = Math.round(cx - half); x <= Math.round(cx + half); x++) {
      const nx = (x - cx) / a
      const lit = -nx * 0.6 + ny * 0.7 + 0.2
      const rib = RIBS.some((r) => Math.abs(x - (cx + r * half)) < 0.6)
      pix.set(x, y, rib ? p.dome[1] : ramp(p.dome, lit, x, y, 0))
    }
    pix.set(Math.round(cx + half), y, p.ink)
  }
  pix.rect(Math.round(cx - a) - 1, baseY - 1, Math.round(a * 2) + 3, 1, p.dome[0])
}

/** Friso de olas: franja oscura con crestas redondeadas claras y espuma en lo alto de cada una */
function frieze(pix: Pixmap, p: WaterGymPalette, y: number, height: number, period: number) {
  for (let x = 0; x < pix.w; x++) {
    const crest = Math.round(((Math.sin((2 * Math.PI * x) / period) + 1) / 2) * (height - 2))
    pix.rect(x, y, 1, height, p.wave[0])
    pix.rect(x, y + height - 1 - crest, 1, crest + 1, p.wave[1])
    pix.set(x, y + height - 1 - crest, p.wave[2])
  }
  pix.rect(0, y + height, pix.w, 1, p.ink)
}

/** Pared de azulejos: juntas en el tono de sombra, más clara a la izquierda */
function tiles(pix: Pixmap, p: WaterGymPalette, top: number, height: number, tile: number) {
  for (let y = top; y < top + height; y++)
    for (let x = 0; x < pix.w; x++) {
      const joint = (y - top) % tile === 0 || x % tile === 0
      pix.set(x, y, joint ? p.wall[1] : x < pix.w * 0.3 ? p.wall[3] : p.wall[2])
    }
  pix.rect(pix.w - 1, top, 1, height, p.ink)
  pix.rect(0, top + height - 1, pix.w, 1, p.ink)
}

function disc(pix: Pixmap, cx: number, cy: number, r: number, paint: (dx: number, dy: number, rim: boolean) => Color) {
  for (let dy = -r; dy <= r; dy++)
    for (let dx = -r; dx <= r; dx++) {
      const d = Math.hypot(dx, dy)
      if (d <= r + 0.3) pix.set(cx + dx, cy + dy, paint(dx, dy, d > r - 1))
    }
}

/** Ojo de buey: aro de hierro con el cristal y un reflejo arriba a la izquierda */
const porthole = (pix: Pixmap, p: WaterGymPalette, cx: number, cy: number, r: number) =>
  disc(pix, cx, cy, r, (dx, dy, rim) => (rim ? (dx + dy > 0 ? p.ink : p.wall[0]) : dx + dy < -r * 0.5 ? p.glass[2] : p.glass[1]))

/** Gota de agua sobre un disco claro: punta arriba y cuerpo redondo abajo */
function emblem(pix: Pixmap, p: WaterGymPalette, cx: number, cy: number, r: number) {
  disc(pix, cx, cy, r, (dx, dy, rim) => (rim ? (dx + dy > 0 ? p.ink : p.wall[1]) : p.emblem[0]))
  const body = Math.max(2, Math.round(r * 0.45))
  for (let dy = -r + 2; dy <= body; dy++) {
    const half = dy < 0 ? Math.round(((dy + r - 2) / (r - 2)) * body * 0.9) : Math.round(Math.sqrt(body * body - dy * dy))
    for (let dx = -half; dx <= half; dx++) pix.set(cx + dx, cy + dy + 1, dx > half / 2 ? p.emblem[1] : p.emblem[2])
  }
  pix.set(cx - 1, cy + 1, p.emblem[3])
}

/** Puerta de cristal de dos hojas con marco */
function door(pix: Pixmap, p: WaterGymPalette, cx: number, bottom: number, w: number, h: number) {
  const x = Math.round(cx - w / 2)
  pix.rect(x - 1, bottom - h - 1, w + 2, h + 1, p.glass[0])
  pix.rect(x, bottom - h, w, h, p.glass[1])
  pix.rect(x + 1, bottom - h + 1, 2, h - 3, p.glass[2])
  pix.rect(Math.round(cx), bottom - h, 1, h, p.glass[0])
  pix.rect(x + w + 1, bottom - h - 1, 1, h + 1, p.ink)
}

/** Gimnasio a `scale` (1 = 112 píxeles de ancho) */
export function waterGym(p: WaterGymPalette, scale = 1): Pixmap {
  const s = (n: number) => Math.max(2, Math.round(n * scale))
  const [width, wall, band, domeW, domeH] = [s(BASE.width), s(BASE.wall), s(BASE.frieze), s(BASE.dome[0]), s(BASE.dome[1])]
  const pix = new Pixmap(width, domeH + band + wall + 1, false)
  const cx = Math.round(width / 2)
  dome(pix, p, cx, domeH, domeW / 2, domeH)
  const body = new Pixmap(width, band + wall + 1, false)
  frieze(body, p, 0, band, s(BASE.tile) * 3)
  tiles(body, p, band + 1, wall, s(BASE.tile))
  pix.stamp(body, 0, domeH)
  const bottom = pix.h - 1
  const [dw, dh] = [s(BASE.door[0]), s(BASE.door[1])]
  door(pix, p, cx, bottom, dw, dh)
  const r = s(BASE.porthole)
  const windowY = domeH + band + Math.round(wall * 0.45)
  for (const at of [0.14, 0.3, 0.7, 0.86]) porthole(pix, p, Math.round(width * at), windowY, r)
  emblem(pix, p, cx, domeH - Math.round(domeH * 0.4), s(BASE.emblem))
  return pix
}

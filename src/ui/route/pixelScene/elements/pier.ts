// Piezas de muelle de madera: borde de tablones, valla de postes con cuerda, bolardos de hierro y pilotes que salen
// del agua. Luz arriba a la izquierda y contorno solo en el lado de sombra.

import type { Color, Pixmap } from '../paint/pixmap'

export interface PierPalette {
  /** Madera: contorno, sombra, base, luz y brillo */
  wood: readonly Color[]
  /** Cuerda: sombra y luz */
  rope: readonly Color[]
  /** Hierro de los bolardos: contorno, base y luz */
  iron: readonly Color[]
}

/** Medidas en píxeles de arte: largo de tablón, separación de los postes de la valla, alto del poste y comba de la cuerda */
const PIER = { plank: 14, fenceGap: 26, post: 9, sag: 2 }

/** Borde de muelle de `height` filas: canto claro, tablones con juntas desplazadas por filas y sombra abajo */
export function plankEdge(pix: Pixmap, top: number, height: number, p: PierPalette, offset = 0) {
  const [ink, shade, base, light, shine] = p.wood
  pix.rect(0, top, pix.w, 1, shine)
  pix.rect(0, top + 1, pix.w, height - 1, base)
  for (let row = 0; row * 3 + 1 < height; row++) {
    const y = top + 1 + row * 3
    pix.rect(0, y, pix.w, 1, row % 2 ? base : light)
    for (let x = offset + (row % 2) * (PIER.plank / 2); x < pix.w + offset + PIER.plank; x += PIER.plank) pix.rect(x, y, 1, 3, shade)
  }
  pix.rect(0, top + height - 1, pix.w, 1, ink)
}

/** Valla de postes de madera con una cuerda que cuelga entre ellos, apoyada en `baseY` */
export function ropeFence(pix: Pixmap, baseY: number, p: PierPalette, phase = 0) {
  const [ink, shade, base, light] = p.wood
  const top = baseY - PIER.post
  for (let x = 0; x < pix.w; x++) {
    const u = (((x - phase) % PIER.fenceGap) + PIER.fenceGap) % PIER.fenceGap / PIER.fenceGap
    const y = top + 2 + Math.round(Math.sin(Math.PI * u) * PIER.sag)
    pix.set(x, y, p.rope[1])
    pix.set(x, y + 1, p.rope[0])
  }
  for (let x = phase; x < pix.w + phase; x += PIER.fenceGap) {
    pix.rect(x - 1, top, 3, PIER.post, base)
    pix.rect(x - 1, top, 1, PIER.post, light)
    pix.rect(x + 1, top + 1, 1, PIER.post - 1, shade)
    pix.rect(x - 1, top, 3, 1, light)
    pix.rect(x + 2, top + 1, 1, PIER.post - 1, ink)
  }
}

/** Bolardo de amarre: seta de hierro con la base en (`cx`, `groundY`) */
export function bollard(pix: Pixmap, cx: number, groundY: number, p: PierPalette) {
  const [ink, base, light] = p.iron
  pix.rect(cx - 2, groundY - 3, 4, 3, base)
  pix.rect(cx - 2, groundY - 3, 1, 3, light)
  pix.rect(cx - 3, groundY - 5, 6, 2, base)
  pix.rect(cx - 3, groundY - 5, 5, 1, light)
  pix.rect(cx + 2, groundY - 4, 1, 4, ink)
}

/** Pilote de madera que sale del agua (de `waterY` hacia arriba `height` filas), con su anillo de cuerda */
export function piling(pix: Pixmap, cx: number, waterY: number, height: number, p: PierPalette) {
  const [ink, shade, base, light, shine] = p.wood
  const top = waterY - height
  pix.rect(cx - 2, top, 4, height, base)
  pix.rect(cx - 2, top, 1, height, light)
  pix.rect(cx + 1, top, 1, height, shade)
  pix.rect(cx + 2, top + 1, 1, height - 1, ink)
  pix.rect(cx - 2, top, 4, 1, shine)
  pix.rect(cx - 2, top + 3, 5, 1, p.rope[1])
  pix.rect(cx - 2, top + 4, 5, 1, p.rope[0])
}

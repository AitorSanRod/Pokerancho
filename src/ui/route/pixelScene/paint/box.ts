// Rectángulos con volumen para muebles y marcos: luz arriba a la izquierda, sombra abajo a la derecha.

import type { Color, Pixmap } from './pixmap'

/** `tones`: sombra, base y luz. Rellena con la base, aclara el borde de arriba y la izquierda y oscurece el resto */
export function shadedBox(pix: Pixmap, x: number, y: number, w: number, h: number, tones: readonly Color[]) {
  const [shadow, base, light] = tones
  pix.rect(x, y, w, h, base)
  pix.rect(x, y, w, 1, light)
  pix.rect(x, y, 1, h, light)
  pix.rect(x + w - 1, y + 1, 1, h - 1, shadow)
  pix.rect(x + 1, y + h - 1, w - 1, 1, shadow)
}

/** Hueco hundido (panel, cajón, pantalla): al revés que `shadedBox`, la sombra arriba a la izquierda */
export function insetBox(pix: Pixmap, x: number, y: number, w: number, h: number, tones: readonly Color[]) {
  const [shadow, base, light] = tones
  pix.rect(x, y, w, h, base)
  pix.rect(x, y, w, 1, shadow)
  pix.rect(x, y, 1, h, shadow)
  pix.rect(x + w - 1, y + 1, 1, h - 1, light)
  pix.rect(x + 1, y + h - 1, w - 1, 1, light)
}

/** Círculo relleno de radio `r` centrado en (`cx`, `cy`) */
export function disc(pix: Pixmap, cx: number, cy: number, r: number, color: Color) {
  for (let dy = -r; dy <= r; dy++)
    for (let dx = -r; dx <= r; dx++) if (dx * dx + dy * dy <= r * r + r * 0.6) pix.set(cx + dx, cy + dy, color)
}

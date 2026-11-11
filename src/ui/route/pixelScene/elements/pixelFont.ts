// Fuente de 5 píxeles de alto para los textos pintados en las escenas (carteles). Solo mayúsculas sin tilde.

import type { Color, Pixmap } from '../paint/pixmap'

/** Alto de una letra, en píxeles de arte */
export const GLYPH_HEIGHT = 5

const GLYPHS: Record<string, string[]> = {
  A: ['.#.', '#.#', '###', '#.#', '#.#'],
  B: ['##.', '#.#', '##.', '#.#', '##.'],
  C: ['.##', '#..', '#..', '#..', '.##'],
  D: ['##.', '#.#', '#.#', '#.#', '##.'],
  E: ['###', '#..', '##.', '#..', '###'],
  F: ['###', '#..', '##.', '#..', '#..'],
  G: ['.##', '#..', '#.#', '#.#', '.##'],
  H: ['#.#', '#.#', '###', '#.#', '#.#'],
  I: ['###', '.#.', '.#.', '.#.', '###'],
  J: ['..#', '..#', '..#', '#.#', '.#.'],
  K: ['#.#', '#.#', '##.', '#.#', '#.#'],
  L: ['#..', '#..', '#..', '#..', '###'],
  M: ['#...#', '##.##', '#.#.#', '#...#', '#...#'],
  N: ['#..#', '##.#', '#.##', '#..#', '#..#'],
  O: ['.#.', '#.#', '#.#', '#.#', '.#.'],
  P: ['##.', '#.#', '##.', '#..', '#..'],
  Q: ['.#.', '#.#', '#.#', '##.', '.##'],
  R: ['##.', '#.#', '##.', '#.#', '#.#'],
  S: ['.##', '#..', '.#.', '..#', '##.'],
  T: ['###', '.#.', '.#.', '.#.', '.#.'],
  U: ['#.#', '#.#', '#.#', '#.#', '###'],
  V: ['#.#', '#.#', '#.#', '#.#', '.#.'],
  W: ['#...#', '#...#', '#.#.#', '##.##', '#...#'],
  X: ['#.#', '#.#', '.#.', '#.#', '#.#'],
  Y: ['#.#', '#.#', '.#.', '.#.', '.#.'],
  Z: ['###', '..#', '.#.', '#..', '###'],
  0: ['.#.', '#.#', '#.#', '#.#', '.#.'],
  1: ['.#.', '##.', '.#.', '.#.', '###'],
  2: ['##.', '..#', '.#.', '#..', '###'],
  3: ['##.', '..#', '.#.', '..#', '##.'],
  4: ['#.#', '#.#', '###', '..#', '..#'],
  5: ['###', '#..', '##.', '..#', '##.'],
  6: ['.##', '#..', '##.', '#.#', '.#.'],
  7: ['###', '..#', '.#.', '.#.', '.#.'],
  8: ['.#.', '#.#', '.#.', '#.#', '.#.'],
  9: ['.#.', '#.#', '.##', '..#', '##.'],
  '-': ['..', '..', '##', '..', '..'],
  '.': ['.', '.', '.', '.', '#'],
  "'": ['#', '#', '.', '.', '.'],
  ' ': ['..', '..', '..', '..', '..'],
}

/** Pasa el texto a lo que sabe pintar la fuente: mayúsculas, sin tildes y con espacio en lo desconocido */
export function toGlyphText(text: string): string {
  const plain = text.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase()
  return [...plain].map((ch) => (ch in GLYPHS ? ch : ' ')).join('')
}

/** Ancho del texto (ya pasado por `toGlyphText`), con un píxel entre letras */
export function textWidth(text: string): number {
  return [...text].reduce((w, ch) => w + GLYPHS[ch][0].length + 1, -1)
}

export function paintText(pix: Pixmap, text: string, x: number, y: number, color: Color) {
  let cx = x
  for (const ch of text) {
    const glyph = GLYPHS[ch]
    glyph.forEach((row, gy) => [...row].forEach((cell, gx) => cell === '#' && pix.set(cx + gx, y + gy, color)))
    cx += glyph[0].length + 1
  }
}

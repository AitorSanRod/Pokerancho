// Mesa de laboratorio blanca con cajonera y, encima, cosas de laboratorio: monitor, matraces, microscopio y libros.

import { insetBox, shadedBox } from '../paint/box'
import { between, pick, type Rng } from '../paint/noise'
import type { Color, Pixmap } from '../paint/pixmap'
import { monitor, type MachinePalette } from './labMachine'

export interface BenchPalette extends MachinePalette {
  /** Cristal de los matraces: sombra, base y luz */
  glass: readonly Color[]
  /** Líquidos de colores */
  liquids: readonly Color[]
  /** Libros: cada uno, base y sombra */
  books: readonly (readonly Color[])[]
}

/** Alto de la mesa (del suelo al tablero), en píxeles de arte */
export const BENCH_HEIGHT = 17

/** Mesa de `width` de ancho apoyada en `groundY`, con cosas encima puestas al azar */
export function labBench(pix: Pixmap, rng: Rng, p: BenchPalette, x: number, groundY: number, width: number) {
  const top = groundY - BENCH_HEIGHT
  const cabinet = Math.round(width * 0.42)
  for (const lx of [x + 2, x + width - cabinet - 2]) {
    pix.rect(lx, top + 3, 2, BENCH_HEIGHT - 3, p.metal[2])
    pix.rect(lx + 1, top + 3, 1, BENCH_HEIGHT - 3, p.metal[1])
  }
  shadedBox(pix, x + width - cabinet - 1, top + 3, cabinet - 1, BENCH_HEIGHT - 2, p.metal.slice(2, 5))
  for (let dy = 5; dy < BENCH_HEIGHT - 3; dy += 5) {
    insetBox(pix, x + width - cabinet + 1, top + dy, cabinet - 5, 4, p.metal.slice(1, 4))
    pix.rect(x + width - Math.round(cabinet / 2) - 3, top + dy + 2, 3, 1, p.metal[0])
  }
  pix.rect(x - 1, top, width + 2, 1, p.metal[4])
  pix.rect(x - 1, top + 1, width + 2, 1, p.metal[3])
  pix.rect(x - 1, top + 2, width + 2, 1, p.metal[1])
  for (let cx = x + Math.round(between(rng, 2, 6)); cx < x + width - 10; cx += Math.round(between(rng, 14, 20)))
    pick(rng, ITEMS)(pix, rng, p, cx, top)
}

type Item = (pix: Pixmap, rng: Rng, p: BenchPalette, x: number, baseY: number) => void

const ITEMS: Item[] = [
  (pix, rng, p, x, baseY) => monitor(pix, rng, p, x, baseY, 12),
  flasks,
  microscope,
  bookStack,
]

/** Uno o dos matraces con líquido de color */
function flasks(pix: Pixmap, rng: Rng, p: BenchPalette, x: number, baseY: number) {
  for (let i = rng() < 0.5 ? 1 : 2; i > 0; i--, x += 8) {
    const liquid = pick(rng, p.liquids)
    for (let row = 0; row < 6; row++) {
      const y = baseY - 1 - row
      const half = 3 - Math.floor(row / 2)
      pix.rect(x - half, y, half * 2 + 1, 1, row < 3 ? liquid : p.glass[1])
      pix.set(x + half, y, p.glass[0])
    }
    pix.rect(x - 1, baseY - 9, 2, 3, p.glass[1])
    pix.set(x - 1, baseY - 9, p.glass[2])
    pix.set(x - 2, baseY - 3, p.glass[2])
  }
}

function microscope(pix: Pixmap, _rng: Rng, p: BenchPalette, x: number, baseY: number) {
  pix.rect(x, baseY - 2, 8, 2, p.metal[1])
  pix.rect(x, baseY - 2, 7, 1, p.metal[3])
  pix.rect(x + 5, baseY - 10, 2, 8, p.metal[1])
  pix.rect(x + 1, baseY - 6, 6, 1, p.metal[2])
  for (let k = 0; k < 5; k++) pix.rect(x + 2 + Math.floor(k / 2), baseY - 13 + k, 2, 1, p.metal[k < 2 ? 3 : 2])
  pix.rect(x + 1, baseY - 14, 3, 1, p.metal[0])
}

function bookStack(pix: Pixmap, rng: Rng, p: BenchPalette, x: number, baseY: number) {
  for (let i = 0, y = baseY - 1; i < 2 + Math.floor(rng() * 2); i++, y -= 2) {
    const [base, shadow] = pick(rng, p.books)
    const w = Math.round(between(rng, 7, 10))
    const dx = Math.round(between(rng, -1, 1))
    pix.rect(x + dx, y - 1, w, 2, base)
    pix.rect(x + dx, y, w, 1, shadow)
  }
}

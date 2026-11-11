// Suelo de parqué: filas de tablas que se ensanchan hacia delante (sensación de profundidad), juntas a tresbolillo
// y tonos de madera planos, con la sombra del rodapié en la primera fila.

import { between, hash, makeRng, type Rng } from '../../paint/noise'
import { Pixmap } from '../../paint/pixmap'
import { PARQUET } from './palette'

/** Alto de cada fila de tablas, del fondo (junto a la pared) a delante; suman el alto del suelo */
const ROWS = [3, 3, 4, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8]
/** Alto del suelo, en píxeles de arte */
export const FLOOR_HEIGHT = ROWS.reduce((s, h) => s + h, 0)
/** Ancho de la tesela del suelo */
const WIDTH = 480
/** Largo de una tabla en múltiplos del alto de su fila [mín, máx] */
const PLANK_LENGTH: [number, number] = [7, 11]
/** Tonos de tabla (índices de `PARQUET`) */
const TONES = [2, 3, 4]

export function parquet(seed: number): Pixmap {
  const rng = makeRng(seed + 321)
  const pix = new Pixmap(WIDTH, FLOOR_HEIGHT)
  let y = 0
  ROWS.forEach((h, row) => {
    for (const [x, len] of planks(rng, h)) plank(pix, x, y, len, h, TONES[Math.floor(hash(x, row, seed) * TONES.length)])
    y += h
  })
  pix.rect(0, 1, WIDTH, 1, PARQUET[1])
  return pix
}

/** Tablas de una fila como [inicio, largo], que cubren justo la tesela (la última se alarga si quedaba corta) */
function planks(rng: Rng, h: number): [number, number][] {
  const start = Math.round(between(rng, 0, h * PLANK_LENGTH[0]))
  const cuts: number[] = []
  for (let x = start; x < start + WIDTH; x += Math.round(h * between(rng, ...PLANK_LENGTH))) cuts.push(x)
  if (start + WIDTH - cuts[cuts.length - 1] < h * PLANK_LENGTH[0] * 0.6 && cuts.length > 1) cuts.pop()
  return cuts.map((x, i) => [x, (cuts[i + 1] ?? start + WIDTH) - x])
}

/** Una tabla: junta oscura arriba y a la izquierda, brillo en su primera fila y el resto del tono elegido */
function plank(pix: Pixmap, x: number, y: number, len: number, h: number, tone: number) {
  pix.rect(x, y, len, h, PARQUET[tone])
  if (h > 3) pix.rect(x + 1, y + 1, len - 1, 1, PARQUET[tone + 1])
  pix.rect(x, y, len, 1, PARQUET[0])
  pix.rect(x, y, 1, h, PARQUET[0])
}

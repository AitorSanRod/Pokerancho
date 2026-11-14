// Suelo del pasillo del barco: una franja de tarima junto a la pared, la moqueta roja con cenefa dorada a los dos
// lados y un dibujo de rombos pequeños que se separan hacia delante (profundidad), y otra franja de tarima delante.

import { hash } from '../../paint/noise'
import { Pixmap } from '../../paint/pixmap'
import { CARPET, CARPET_GOLD, DECK } from './palette'

/** Alto del suelo, en píxeles de arte (el mismo que el parqué del laboratorio) */
export const FLOOR_HEIGHT = 70
/** Ancho de la tesela (divisible por la separación de los rombos de cada fila) */
const WIDTH = 480
/** Filas de tarima detrás (junto a la pared) y delante de la moqueta */
const DECK_BACK = 4
const DECK_FRONT = 8
/** Filas de cada cenefa dorada */
const BORDER = 3
/** Filas de rombos de la moqueta: [fila desde arriba, separación en horizontal]; más separados cuanto más cerca */
const MOTIF_ROWS: [number, number][] = [
  [13, 16],
  [22, 20],
  [33, 24],
  [46, 30],
]
/** Largo de las tablas de la tarima [detrás, delante] */
const BOARD = [24, 40]

export function carpetFloor(seed: number): Pixmap {
  const pix = new Pixmap(WIDTH, FLOOR_HEIGHT)
  const carpetTop = DECK_BACK
  const carpetBottom = FLOOR_HEIGHT - DECK_FRONT
  deckStrip(pix, seed, 0, DECK_BACK, BOARD[0])
  deckStrip(pix, seed + 1, carpetBottom, DECK_FRONT, BOARD[1])
  pix.rect(0, carpetTop, WIDTH, carpetBottom - carpetTop, CARPET[1])
  pix.rect(0, carpetTop + BORDER + 1, WIDTH, 2, CARPET[0])
  border(pix, carpetTop + 1)
  border(pix, carpetBottom - BORDER - 1)
  pix.rect(0, carpetBottom, WIDTH, 1, CARPET[0])
  MOTIF_ROWS.forEach(([row, pitch], i) => {
    const offset = i % 2 === 0 ? 0 : pitch / 2
    for (let x = offset; x < WIDTH; x += pitch) diamond(pix, x, carpetTop + row, i < 2 ? 1 : 2)
  })
  return pix
}

/** Cenefa dorada: dos líneas con un hilo rojo entre ellas */
function border(pix: Pixmap, y: number) {
  pix.rect(0, y, WIDTH, 1, CARPET_GOLD[2])
  pix.rect(0, y + 1, WIDTH, 1, CARPET[2])
  pix.rect(0, y + 2, WIDTH, 1, CARPET_GOLD[1])
}

/** Rombo dorado de radio `r` con el lado de abajo en sombra */
function diamond(pix: Pixmap, cx: number, cy: number, r: number) {
  for (let dy = -r; dy <= r; dy++) {
    const half = r - Math.abs(dy)
    pix.rect(cx - half, cy + dy, half * 2 + 1, 1, dy > 0 ? CARPET_GOLD[0] : CARPET_GOLD[1])
  }
  pix.set(cx, cy - r, CARPET_GOLD[2])
}

/** Franja de tablas de tarima de `height` filas desde `top`, con juntas cada `board` */
function deckStrip(pix: Pixmap, seed: number, top: number, height: number, board: number) {
  for (let x = 0; x < WIDTH; x += board) {
    const tone = 2 + Math.floor(hash(x, top, seed) * 3)
    pix.rect(x, top, board, height, DECK[tone])
    pix.rect(x, top + 1, board, 1, DECK[tone + 1])
    pix.rect(x, top, 1, height, DECK[0])
  }
  pix.rect(0, top, WIDTH, 1, DECK[0])
}

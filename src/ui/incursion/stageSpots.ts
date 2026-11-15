import { MAX_ROOM_FOES } from '../../data/incursions'
import { PARTY_SIZE } from '../../game/incursion/party'

// Dónde se pinta cada Pokémon en la escena de la incursión: el grupo a la izquierda, en filas de dos que suben hacia el
// fondo (los grupos grandes, como la sala de un jefe de raid, en filas de tres), y los rivales a la derecha, donde el
// rival de una ruta.

/** `left` en % del ancho, `rise` en px sobre el suelo, `scale` (las filas del fondo, más pequeñas) y `z` (orden de filas) */
export interface Spot {
  left: number
  rise: number
  scale: number
  z: number
}

/** Pokémon del grupo por fila; en los grupos de más de PARTY_SIZE, BIG_PER_ROW */
const PER_ROW = 2
const BIG_PER_ROW = 3
/** Centro de la primera columna y separación entre columnas, en % del ancho de la escena (en los grupos grandes, BIG_COL_GAP) */
const FIRST_COL = 12
const COL_GAP = 21
const BIG_COL_GAP = 16
/** Las filas impares van corridas hacia el centro, al tresbolillo (en % del ancho) */
const STAGGER = 9
/** Píxeles que sube cada fila sobre la de delante */
const ROW_RISE = 38
/** Escala de cada fila respecto a la de delante */
const ROW_SHRINK = 0.9
/** Escala de la primera fila en los grupos grandes, para que quepan sin taparse tanto */
const BIG_SCALE = 0.8

/** Dónde va el Pokémon `index` de un grupo de `count` */
export function partySpot(index: number, count: number): Spot {
  const big = count > PARTY_SIZE
  const perRow = big ? BIG_PER_ROW : PER_ROW
  const row = Math.floor(index / perRow)
  const col = index % perRow
  return {
    left: FIRST_COL + col * (big ? BIG_COL_GAP : COL_GAP) + (row % 2) * STAGGER,
    rise: row * ROW_RISE,
    scale: (big ? BIG_SCALE : 1) * ROW_SHRINK ** row,
    z: 10 - row,
  }
}

/** Rivales: uno solo, donde el de una ruta; varios, dos delante y uno detrás (hasta MAX_ROOM_FOES) */
const FOE_SPOTS: Record<number, Spot[]> = {
  1: [{ left: 74, rise: 0, scale: 1, z: 10 }],
  2: [
    { left: 66, rise: 0, scale: 1, z: 10 },
    { left: 86, rise: 40, scale: 0.9, z: 9 },
  ],
  3: [
    { left: 64, rise: 0, scale: 1, z: 10 },
    { left: 86, rise: 0, scale: 1, z: 10 },
    { left: 75, rise: 70, scale: 0.88, z: 9 },
  ],
}

export const foeSpot = (index: number, count: number): Spot => {
  const spots = FOE_SPOTS[count] ?? FOE_SPOTS[MAX_ROOM_FOES]
  return spots[index] ?? spots[spots.length - 1]
}

import { MAX_ROOM_FOES } from '../../data/incursions'

// Dónde se pinta cada Pokémon en la escena de la incursión: el grupo a la izquierda, en filas de dos que suben hacia el
// fondo, y los rivales a la derecha, donde el rival de una ruta.

/** `left` en % del ancho, `rise` en px sobre el suelo, `scale` (las filas del fondo, más pequeñas) y `z` (orden de filas) */
export interface Spot {
  left: number
  rise: number
  scale: number
  z: number
}

/** Pokémon del grupo por fila */
const PER_ROW = 2
/** Centro de la primera columna y separación entre columnas, en % del ancho de la escena */
const FIRST_COL = 12
const COL_GAP = 21
/** Las filas impares van corridas hacia el centro, al tresbolillo (en % del ancho) */
const STAGGER = 9
/** Píxeles que sube cada fila sobre la de delante */
const ROW_RISE = 38
/** Escala de cada fila respecto a la de delante */
const ROW_SHRINK = 0.9

export function partySpot(index: number): Spot {
  const row = Math.floor(index / PER_ROW)
  const col = index % PER_ROW
  return {
    left: FIRST_COL + col * COL_GAP + (row % 2) * STAGGER,
    rise: row * ROW_RISE,
    scale: ROW_SHRINK ** row,
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

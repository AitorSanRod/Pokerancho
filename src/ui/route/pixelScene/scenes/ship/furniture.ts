// Paradas del pasillo del barco: un banco de caoba con cojín y una pila de maletas, apoyados en la moqueta por detrás
// del Pokémon, con su sombra en el suelo.

import { StopLandmark } from '../../../../../data/maps'
import type { Landmark } from '../../engine/types'
import { bench, luggageStack, type ShipFurniturePalette } from '../../elements/shipFurniture'
import { makeRng } from '../../paint/noise'
import { Pixmap } from '../../paint/pixmap'
import * as C from './palette'

/** Filas de sombra en el suelo bajo los muebles */
const SHADOW_ROWS = 2
/** Medidas de los muebles: ancho del banco, ancho de la maleta de abajo y cuántas van apiladas */
const SIZE = { bench: 48, luggage: 28, cases: 3 }

const FURNITURE: ShipFurniturePalette = { wood: C.MAHOGANY, cushion: C.CUSHION, luggage: C.LUGGAGE, brass: C.BRASS }

/** Banco y maletas como elementos de parada, con la base a `bottom` y el `parallax` del suelo */
export function furnitureLandmarks(seed: number, bottom: number, parallax: number): Landmark[] {
  const benchPix = new Pixmap(SIZE.bench + 4, 30, false)
  bench(benchPix, FURNITURE, 0, groundOf(benchPix), SIZE.bench)
  shadow(benchPix, 0, SIZE.bench)
  const luggagePix = new Pixmap(SIZE.luggage + 6, 34, false)
  luggageStack(luggagePix, makeRng(seed + 441), FURNITURE, 2, groundOf(luggagePix), SIZE.luggage, SIZE.cases)
  shadow(luggagePix, 2, SIZE.luggage)
  const at = { parallax, bottom: bottom - SHADOW_ROWS, afterLayer: 'path' }
  return [
    { id: StopLandmark.Bench, label: 'Banco', pixmap: benchPix, ...at },
    { id: StopLandmark.Luggage, label: 'Maletas', pixmap: luggagePix, ...at },
  ]
}

const groundOf = (pix: Pixmap) => pix.h - 1 - SHADOW_ROWS

function shadow(pix: Pixmap, x: number, width: number) {
  pix.rect(x + 1, groundOf(pix) + 1, width + 2, SHADOW_ROWS, C.FLOOR_SHADOW)
}

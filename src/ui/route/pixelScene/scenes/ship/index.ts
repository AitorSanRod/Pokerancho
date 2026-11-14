// Barco (pasillo de un barco de pasajeros, de día): pared crema con zócalo de caoba y pasamanos de latón, algún ojo de
// buey con el mar, puertas de camarote numeradas, cuadros, salvavidas y apliques, techo con vigas y plafones, moqueta
// roja con cenefa dorada entre dos franjas de tarima. Paradas: un banco y unas maletas. Parte del laboratorio.

import type { SceneDef, SceneLayer } from '../../engine/types'
import { FLOOR_HEIGHT, carpetFloor } from './carpet'
import { shipCeiling } from './ceiling'
import { furnitureLandmarks } from './furniture'
import { shipWall, sky } from './wall'

const layer = (id: string, label: string, frames: SceneLayer['frames'], offset: number, parallax: number, extra: Partial<SceneLayer> = {}): SceneLayer => ({
  id,
  label,
  frames,
  anchor: 'bottom',
  offset,
  parallax,
  plane: 'back',
  ...extra,
})

/**
 * Parallax de todo el pasillo (pared, techo, moqueta y paradas): se mueve a la vez, como una sola habitación. Más lento
 * que un camino de fuera, como el parqué del laboratorio, para que el Pokémon no parezca deslizarse
 */
const ROOM_PARALLAX = 0.7
/** Altura sobre el borde inferior de la base de los muebles de las paradas (en la moqueta, detrás del Pokémon) */
const STOP_BOTTOM = FLOOR_HEIGHT - 16

export function shipScene(seed: number): SceneDef {
  return {
    name: 'Barco',
    sky,
    walkerBottom: 34,
    layers: [
      layer('wall', 'Pared', [shipWall(seed)], FLOOR_HEIGHT, ROOM_PARALLAX),
      layer('path', 'Moqueta', [carpetFloor(seed)], 0, ROOM_PARALLAX),
      layer('ceiling', 'Techo', [shipCeiling(seed)], 0, ROOM_PARALLAX, { anchor: 'top' }),
    ],
    landmarks: furnitureLandmarks(seed, STOP_BOTTOM, ROOM_PARALLAX),
  }
}

// Laboratorio (interior luminoso de día): pared clara con zócalo, ventanales que dejan ver el cielo y los árboles de
// fuera y por los que entran rayos de sol, puertas de madera y de cristal, estanterías y máquinas, techo con
// lámparas colgantes, suelo de parqué y mesas de laboratorio y plantas. Base para otros interiores.

import type { SceneDef, SceneLayer } from '../../engine/types'
import { signLandmark } from '../../elements/signpost'
import { ceiling } from './ceiling'
import { FLOOR_HEIGHT, parquet } from './floor'
import { frontPlants, furniture } from './furniture'
import { PARQUET, WOOD } from './palette'
import { sky, sunbeams, wall } from './wall'

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

/** Parallax de la pared y de lo que va pegado a ella (los rayos de sol de sus ventanas) */
const WALL_PARALLAX = 0.5
/**
 * Parallax del parqué y de lo que se apoya en él (el cartel): más lento que el camino de fuera, porque las juntas de
 * las tablas a la velocidad del camino hacen que el Pokémon parezca deslizarse
 */
const FLOOR_PARALLAX = 0.7

export function labScene(seed: number): SceneDef {
  return {
    name: 'Laboratorio',
    sky,
    walkerBottom: 34,
    layers: [
      layer('wall', 'Pared', [wall(seed)], FLOOR_HEIGHT, WALL_PARALLAX),
      layer('path', 'Parqué', [parquet(seed)], 0, FLOOR_PARALLAX),
      layer('sunbeams', 'Rayos de sol', [sunbeams(seed, FLOOR_HEIGHT)], 0, WALL_PARALLAX),
      layer('ceiling', 'Techo', [ceiling(seed)], 0, 0.55, { anchor: 'top' }),
      layer('furniture', 'Muebles', [furniture(seed)], FLOOR_HEIGHT - 10, 0.62),
      layer('front-plants', 'Plantas en primer plano', [frontPlants(seed)], -14, 1, { plane: 'front' }),
    ],
    landmarks: [signLandmark('LABORATORIO', WOOD, PARQUET, FLOOR_HEIGHT - 14, FLOOR_PARALLAX)],
  }
}

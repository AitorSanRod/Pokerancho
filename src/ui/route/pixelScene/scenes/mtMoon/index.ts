// Monte Moon (bioma MtMoon): cueva casi a oscuras en la que solo alumbran los cristales, con
// fósiles en las paredes, alguna Piedra Lunar junto al camino, gotas que caen del techo y el cartel de la entrada
// como elemento de parada. Parte de la escena Cueva, que se queda como está.

import type { SceneDef, SceneLayer } from '../../engine/types'
import { ceiling } from '../cave/backdrop'
import { cavePath } from '../cave/ground'
import { PATH } from '../meadow/ground'
import { farWall, midWall, sky } from './backdrop'
import { foreground, nearRocks } from './near'
import { signLandmark } from '../../elements/signpost'
import { CEILING, FLOOR, FLOOR_INK, NEAR_ROCK, PUDDLE, WOOD } from './palette'
import { mtMoonParticles } from './particles'

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

/** Reborde del camino más ondulado que en la Cueva, para que el pie de las rocas no forme una línea */
const FLOOR_STYLE = { floor: FLOOR, ink: FLOOR_INK, rim: NEAR_ROCK, puddle: PUDDLE, ledge: 7, ledgeSwell: 0.4, rimTop: 5 }

export function mtMoonScene(seed: number): SceneDef {
  return {
    name: 'Monte Moon',
    sky,
    walkerBottom: 34,
    layers: [
      layer('far-wall', 'Pared del fondo', [farWall(seed)], 50, 0.1),
      layer('mid-wall', 'Pared media', [midWall(seed)], 58, 0.24),
      layer('ceiling', 'Techo', [ceiling(seed, 520, 26, [14, 44], CEILING)], 0, 0.32, { anchor: 'top' }),
      layer('near-rocks', 'Peñascos', [nearRocks(seed)], PATH.height - 7, 0.6),
      layer('path', 'Suelo', [cavePath(seed + 30, FLOOR_STYLE)], 0, 1),
      layer('foreground', 'Rocas en primer plano', [foreground(seed)], -4, 1.4, { plane: 'front' }),
    ],
    particles: mtMoonParticles(seed),
    landmarks: [signLandmark('MONTE MOON', WOOD, NEAR_ROCK.colors, PATH.height - PATH.dirtTop - 8)],
  }
}

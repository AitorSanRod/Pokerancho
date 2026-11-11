// Ciudad Celeste: el cielo y las nubes del prado, el mar hasta el horizonte con un faro y veleros, la orilla, una
// fila de casas blancas de tejados azules (con el gimnasio acuático, la tienda y la casa del pescador), un canal con boyas,
// barca, barandilla, farolas y anclas, y una calle de adoquín azulado. Gaviotas de tarde en tarde.

import { StopLandmark } from '../../../../../data/maps'
import type { SceneDef, SceneLayer } from '../../engine/types'
import { fisherHut } from '../../elements/fisherHut'
import { signLandmark } from '../../elements/signpost'
import { waterGym } from '../../elements/waterGym'
import { clouds, sky, wisps } from '../meadow/backdrop'
import { PATH } from '../meadow/ground'
import { WOOD } from '../meadow/palette'
import { coast, farSea, sailboats, shore } from './backdrop'
import { canal } from './canal'
import { cityRow } from './city'
import { ceruleanPath } from './ground'
import { FISHER_HUT, LAWN, WATER_GYM } from './palette'
import { ceruleanParticles } from './particles'

/** Fotogramas del vaivén del agua del canal */
const WATER_FRAMES = 6
/** Altura del horizonte sobre el borde inferior, en píxeles de arte */
const HORIZON = 146
/** Altura del borde de arriba de la calle sobre el borde inferior, en píxeles de arte */
const PATH_TOP = PATH.height - PATH.dirtTop
/** Base del canal: la fila de abajo de su tesela queda tras la acera del muelle */
const CANAL_BOTTOM = 62

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

export function ceruleanCityScene(seed: number): SceneDef {
  const near = cityRow(seed)
  return {
    name: 'Ciudad Celeste',
    sky,
    walkerBottom: 34,
    layers: [
      layer('wisps', 'Nubecillas', [wisps(seed)], 0, 0.02, { anchor: 'top', offset: 8, drift: 2 }),
      layer('clouds', 'Nubes', [clouds(seed)], HORIZON + 4, 0.03, { drift: 3 }),
      layer('far-sea', 'Mar', [farSea(seed)], HORIZON - 30, 0.05),
      layer('sailboats', 'Veleros', [sailboats(seed)], HORIZON - 12, 0.05, { drift: 1.5 }),
      layer('coast', 'Faro', [coast()], HORIZON - 8, 0.06),
      layer('shore', 'Orilla', [shore(seed)], 116, 0.25),
      layer('city', 'Casas', [near.pixmap], 76, 0.32, { emitters: near.emitters }),
      layer('canal', 'Canal', canal(seed, WATER_FRAMES), CANAL_BOTTOM, 0.7, { fps: 3 }),
      layer('path', 'Calle', [ceruleanPath(seed)], 0, 1),
    ],
    particles: ceruleanParticles(seed),
    landmarks: [
      signLandmark('CIUDAD CELESTE', WOOD, LAWN, PATH_TOP - 8),
      { id: StopLandmark.Gym, label: 'Gimnasio', pixmap: waterGym(WATER_GYM), parallax: 0.5, bottom: CANAL_BOTTOM + 38, afterLayer: 'city' },
      { id: StopLandmark.House, label: 'Casa del pescador', pixmap: fisherHut(FISHER_HUT), parallax: 0.5, bottom: CANAL_BOTTOM + 38, afterLayer: 'city' },
    ],
  }
}

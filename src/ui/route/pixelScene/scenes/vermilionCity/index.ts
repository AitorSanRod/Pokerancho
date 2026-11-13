// Ciudad Carmín: el cielo y las nubes del prado, el mar con un gran barco de pasajeros amarrado y veleros, la orilla,
// una fila de casas de paredes crema y tejados naranjas (con el gimnasio eléctrico y la tienda), una dársena con muelle
// de madera, barca, boyas, valla de cuerda, bolardos y farolas, y una calle de losa arenisca. Gaviotas de tarde en tarde.

import { StopLandmark } from '../../../../../data/maps'
import type { SceneDef } from '../../engine/types'
import { electricGym } from '../../elements/electricGym'
import { house } from '../../elements/house'
import { signLandmark } from '../../elements/signpost'
import { farSea, sailboats, shore } from '../ceruleanCity/backdrop'
import { ceruleanParticles } from '../ceruleanCity/particles'
import { clouds, sky, wisps } from '../meadow/backdrop'
import { PATH } from '../meadow/ground'
import { layer } from '../meadow'
import { WOOD } from '../meadow/palette'
import { cityRow, ship } from './city'
import { dock } from './dock'
import { vermilionPath } from './ground'
import { ELECTRIC_GYM, LAWN, ORANGE_HOUSE } from './palette'

/** Fotogramas del vaivén del agua de la dársena */
const WATER_FRAMES = 6
/** Altura del horizonte sobre el borde inferior, en píxeles de arte */
const HORIZON = 146
/** Línea de flotación del barco, por debajo del horizonte, en píxeles de arte */
const SHIP_WATERLINE = HORIZON - 12
/** Altura del borde de arriba de la calle sobre el borde inferior, en píxeles de arte */
const PATH_TOP = PATH.height - PATH.dirtTop
/** Base de la dársena: la fila de abajo de su tesela queda tras la acera del muelle */
const DOCK_BOTTOM = 62

export function vermilionCityScene(seed: number): SceneDef {
  const near = cityRow(seed)
  return {
    name: 'Ciudad Carmín',
    sky,
    walkerBottom: 34,
    layers: [
      layer('wisps', 'Nubecillas', [wisps(seed)], 0, 0.02, { anchor: 'top', offset: 8, drift: 2 }),
      layer('clouds', 'Nubes', [clouds(seed)], HORIZON + 4, 0.03, { drift: 3 }),
      layer('far-sea', 'Mar', [farSea(seed)], HORIZON - 30, 0.05),
      layer('sailboats', 'Veleros', [sailboats(seed + 3)], HORIZON - 12, 0.05, { drift: 1.5 }),
      layer('ship', 'Barco', [ship()], SHIP_WATERLINE - 2, 0.08),
      layer('shore', 'Orilla', [shore(seed)], 116, 0.25),
      layer('city', 'Casas', [near.pixmap], 76, 0.32, { emitters: near.emitters }),
      layer('dock', 'Dársena', dock(seed, WATER_FRAMES), DOCK_BOTTOM, 0.7, { fps: 3 }),
      layer('path', 'Calle', [vermilionPath(seed)], 0, 1),
    ],
    particles: ceruleanParticles(seed),
    landmarks: [
      signLandmark('CIUDAD CARMIN', WOOD, LAWN, PATH_TOP - 8),
      { id: StopLandmark.Gym, label: 'Gimnasio', pixmap: electricGym(ELECTRIC_GYM), parallax: 0.5, bottom: DOCK_BOTTOM + 38, afterLayer: 'city' },
      { id: StopLandmark.House, label: 'Casa', pixmap: house(ORANGE_HOUSE), parallax: 0.5, bottom: DOCK_BOTTOM + 38, afterLayer: 'city' },
    ],
  }
}

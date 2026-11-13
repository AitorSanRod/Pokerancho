// Prado (bioma Meadow, hecho a partir de Ruta 1): colinas al fondo, plantas al borde del camino y un camino ancho.
// Las capas van de la más lejana a la más cercana. El prado al atardecer (`meadowDusk`) usa las mismas capas con otros
// colores, otro cielo y el sol.

import { StopLandmark } from '../../../../../data/maps'
import type { Pixmap } from '../../paint/pixmap'
import type { SceneDef, SceneLayer } from '../../engine/types'
import { house } from '../../elements/house'
import { signLandmark } from '../../elements/signpost'
import { clouds, farHills, hills, sky, wisps } from './backdrop'
import { backTufts, frontTufts, path, PATH } from './ground'
import { ferns, nearTrees, plants } from './near'
import { DAY, type MeadowColors } from './palette'
import { meadowParticles } from './particles'
import { farMeadow, meadow } from './plain'

/** Fotogramas del balanceo de la hierba y las plantas */
const SWAY_FRAMES = 6
/** Altura del borde de arriba de la tierra sobre el borde inferior, en píxeles de arte */
const DIRT_TOP = PATH.height - PATH.dirtTop
/** Base de las nubes sobre el borde inferior, en píxeles de arte: apoyadas sobre las colinas */
const CLOUDS_OFFSET = 128

export const layer = (id: string, label: string, frames: SceneLayer['frames'], offset: number, parallax: number, extra: Partial<SceneLayer> = {}): SceneLayer => ({
  id,
  label,
  frames,
  anchor: 'bottom',
  offset,
  parallax,
  plane: 'back',
  ...extra,
})

/** Lo que cambia entre un prado y otro: nombre, colores, cielo y capas que van detrás de todo (el sol) */
export interface MeadowLook {
  name: string
  colors: MeadowColors
  sky: (height: number) => Pixmap
  behind?: SceneLayer[]
  /** Altura de la base de las nubes sobre el borde inferior, en píxeles de arte */
  cloudsOffset?: number
}

export function meadowSceneOf(seed: number, look: MeadowLook): SceneDef {
  const c = look.colors
  return {
    name: look.name,
    sky: look.sky,
    walkerBottom: 34,
    layers: [
      ...(look.behind ?? []),
      layer('wisps', 'Nubecillas', [wisps(seed, c)], 0, 0.02, { anchor: 'top', offset: 8, drift: 2 }),
      layer('clouds', 'Nubes', [clouds(seed, c)], look.cloudsOffset ?? CLOUDS_OFFSET, 0.03, { drift: 3 }),
      layer('far-hills', 'Colinas lejanas', [farHills(seed, c)], 112, 0.05),
      layer('hills', 'Colinas', [hills(seed, c)], 104, 0.1),
      layer('far-meadow', 'Llanura lejana', [farMeadow(seed, c)], 92, 0.15),
      layer('meadow', 'Llanura', [meadow(seed, c)], 64, 0.27),
      layer('near-trees', 'Árboles cercanos', [nearTrees(seed, c)], PATH.height - 4, 0.7),
      layer('plants', 'Plantas', plants(seed, SWAY_FRAMES, c), PATH.height - 3, 0.9, { fps: 4 }),
      layer('path', 'Camino', [path(seed, c)], 0, 1),
      layer('back-tufts', 'Hierba de atrás', backTufts(seed, SWAY_FRAMES, c), DIRT_TOP - 3, 1, { fps: 5 }),
      layer('front-tufts', 'Hierba de delante', frontTufts(seed, SWAY_FRAMES, c), PATH.height - PATH.dirtBottom - 10, 1.15, { fps: 5, plane: 'front' }),
      layer('ferns', 'Hojas en primer plano', ferns(seed, SWAY_FRAMES, c), -10, 1.6, { fps: 4, plane: 'front' }),
    ],
    particles: meadowParticles(seed),
    landmarks: [
      signLandmark('RUTA 1', c.wood, c.grass, DIRT_TOP - 8),
      { id: StopLandmark.House, label: 'Casa', pixmap: house(c.house), parallax: 0.75, bottom: PATH.height - 4, afterLayer: 'near-trees' },
    ],
  }
}

export const meadowScene = (seed: number): SceneDef => meadowSceneOf(seed, { name: 'Prado', colors: DAY, sky })

// Prado al atardecer (bioma MeadowDusk, Rutas 5 y 6): el mismo prado con luz de tarde dorada, cielo de azul violeta
// a naranja y el sol bajo detrás de las colinas.

import type { SceneDef } from '../../engine/types'
import { layer, meadowSceneOf } from '../meadow'
import { DUSK } from './palette'
import { duskSky, sun } from './sky'

/** Altura de la base de la tesela del sol sobre el borde inferior: el sol queda medio tapado por las colinas lejanas */
const SUN_OFFSET = 114
/** Nubes más altas que de día, para que no tapen el sol */
const CLOUDS_OFFSET = 150

export const meadowDuskScene = (seed: number): SceneDef =>
  meadowSceneOf(seed, {
    name: 'Prado al atardecer',
    colors: DUSK,
    sky: duskSky,
    behind: [layer('sun', 'Sol', [sun()], SUN_OFFSET, 0)],
    cloudsOffset: CLOUDS_OFFSET,
  })

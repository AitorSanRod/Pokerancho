// Suelo de Ciudad Celeste: calle de adoquín azulado (ver elements/pavedStreet) con la acera del muelle detrás, lisa
// para que empalme con el borde del canal, y césped delante.

import { grassField } from '../../elements/grass'
import { pavedStreet, type Verge } from '../../elements/pavedStreet'
import { CURB, LAWN, MORTAR, PAVING, QUAY } from './palette'

const FIELD = [LAWN[0], LAWN[1], LAWN[3]]
const grass: Verge = (pix, rng, top, height) => grassField(pix, rng, top, height, FIELD)
const quay: Verge = (pix, _rng, top, height) => pix.rect(0, top, pix.w, height, QUAY[3])

export const ceruleanPath = (seed: number) => pavedStreet(seed, { paving: PAVING, mortar: MORTAR, curb: CURB, verge: { back: quay, front: grass } })

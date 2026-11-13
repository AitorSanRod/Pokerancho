// Suelo de Ciudad Carmín: calle de losa arenisca (ver elements/pavedStreet) con la tablazón del muelle detrás, para
// que empalme con el borde de la dársena, y césped delante.

import { grassField } from '../../elements/grass'
import { pavedStreet, type Verge } from '../../elements/pavedStreet'
import { CURB, LAWN, MORTAR, PAVING, PIER } from './palette'

const FIELD = [LAWN[0], LAWN[1], LAWN[3]]
const grass: Verge = (pix, rng, top, height) => grassField(pix, rng, top, height, FIELD)
const boards: Verge = (pix, _rng, top, height) => pix.rect(0, top, pix.w, height, PIER.wood[2])

export const vermilionPath = (seed: number) => pavedStreet(seed, { paving: PAVING, mortar: MORTAR, curb: CURB, verge: { back: boards, front: grass } })

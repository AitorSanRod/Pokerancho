// Suelo de Ciudad Plateada: calle de losas de piedra gris entre dos franjas de césped (ver elements/pavedStreet).

import { grassField } from '../../elements/grass'
import { pavedStreet, type Verge } from '../../elements/pavedStreet'
import { CURB, LAWN, MORTAR, PAVING } from './palette'

const FIELD = [LAWN[0], LAWN[1], LAWN[3]]
const grass: Verge = (pix, rng, top, height) => grassField(pix, rng, top, height, FIELD)

export const cityPath = (seed: number) => pavedStreet(seed, { paving: PAVING, mortar: MORTAR, curb: CURB, verge: { back: grass, front: grass } })

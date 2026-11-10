// Plano de la ciudad: una fila de casas blancas de tejados azules sobre césped (ver elements/houseRow), con el
// gimnasio acuático, la tienda del toldo a rayas y la casa del pescador en la fila cercana.

import { fisherHut } from '../../elements/fisherHut'
import { houseRow, type TownStyle } from '../../elements/houseRow'
import { shop } from '../../elements/shop'
import { waterGym } from '../../elements/waterGym'
import { BLUE_HOUSE, FISHER_HUT, LAWN, MORTAR, NAVY_HOUSE, PAVING, SHOP, SKY_HOUSE, TEAL_HOUSE, TREES, WATER_GYM } from './palette'

const STYLE: TownStyle = {
  houses: [BLUE_HOUSE, TEAL_HOUSE, NAVY_HOUSE, SKY_HOUSE],
  big: [{ draw: (scale) => waterGym(WATER_GYM, scale) }, { draw: (scale) => shop(SHOP, scale) }, { draw: (scale) => fisherHut(FISHER_HUT, scale) }],
  lawn: LAWN,
  trees: TREES,
  street: { fill: PAVING[1], top: PAVING[0], ink: MORTAR },
  walkway: { fill: PAVING[2], shade: PAVING[0], ink: MORTAR, step: PAVING, mortar: MORTAR },
  /** Humea a ratos (ver engine/smoke.ts) */
  smokeChance: 0.25,
  floors: [1, 2],
}
/** Casas medianas con el gimnasio, la tienda y la casa del pescador */
export const cityRow = (seed: number) =>
  houseRow(seed + 20, { width: 680, height: 130, lawn: 44, scale: [0.7, 0.88], tree: [9, 12], houses: 7, grass: [0, 1, 2, 3], bigBuilding: true, laneOffset: 14, laneWidth: 6 }, STYLE)

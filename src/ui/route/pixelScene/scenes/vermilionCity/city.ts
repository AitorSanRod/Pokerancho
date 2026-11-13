// Ciudad Carmín: el barco de pasajeros amarrado en el mar del fondo y la fila de casas de tejados naranjas (ver
// elements/houseRow), con el gimnasio eléctrico y la tienda del toldo naranja.

import { electricGym } from '../../elements/electricGym'
import { houseRow, type TownStyle } from '../../elements/houseRow'
import { liner } from '../../elements/liner'
import { shop } from '../../elements/shop'
import { Pixmap } from '../../paint/pixmap'
import { AMBER_HOUSE, CORAL_HOUSE, ELECTRIC_GYM, LAWN, LINER, MORTAR, ORANGE_HOUSE, PAVING, RUST_HOUSE, SHOP, TREES } from './palette'

/** Tesela del barco (ancha, para que se vea de vez en cuando) y popa del barco dentro de ella, en píxeles de arte */
const SHIP_TILE = { width: 560, height: 36, stern: 150 }

/** Barco de pasajeros amarrado, con la línea de flotación dos filas por encima del borde de abajo */
export function ship(): Pixmap {
  const pix = new Pixmap(SHIP_TILE.width, SHIP_TILE.height)
  liner(pix, LINER, SHIP_TILE.stern, pix.h - 2)
  return pix
}

const STYLE: TownStyle = {
  houses: [ORANGE_HOUSE, RUST_HOUSE, AMBER_HOUSE, CORAL_HOUSE],
  big: [{ draw: (scale) => electricGym(ELECTRIC_GYM, scale) }, { draw: (scale) => shop(SHOP, scale) }],
  lawn: LAWN,
  trees: TREES,
  street: { fill: PAVING[1], top: PAVING[0], ink: MORTAR },
  walkway: { fill: PAVING[2], shade: PAVING[0], ink: MORTAR, step: PAVING, mortar: MORTAR },
  /** Humea a ratos (ver engine/smoke.ts) */
  smokeChance: 0.25,
  floors: [1, 2],
}

/** Casas medianas con el gimnasio y la tienda */
export const cityRow = (seed: number) =>
  houseRow(seed + 30, { width: 680, height: 130, lawn: 44, scale: [0.7, 0.88], tree: [9, 12], houses: 7, grass: [0, 1, 2, 3], bigBuilding: true, laneOffset: 14, laneWidth: 6 }, STYLE)

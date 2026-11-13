// Colores de Ciudad Carmín de día: el cielo del prado y el mar, casas de paredes crema y tejados naranjas, el
// gimnasio eléctrico, la tienda del toldo naranja, un muelle de madera y calles de losa arenisca. Cada rampa va de
// oscuro a claro.

import { hex, palette, TRANSPARENT } from '../../paint/pixmap'

export { NEAR_WATER } from '../sea/palette'

/** Césped: sombra, base, luz y brillo */
export const LAWN = palette('#4aa244', '#5cb84a', '#74c856', '#8ed666')

/** Losas arenisca de la calle: sombra, base, luz y brillo; `MORTAR`, juntas */
export const PAVING = palette('#c49a74', '#d4ac84', '#e0bc96', '#ecceaa')
export const MORTAR = hex('#a87e5c')
/** Bordillo: sombra, base y canto iluminado */
export const CURB = palette('#94705a', '#c8ae96', '#f0e2d0')

const CREAM_WALL = { wall: palette('#c2a684', '#dcc4a2', '#f0e0c4', '#fcf2e0'), wallInk: hex('#6a5038') }
const WINDOWS = { wood: palette('#5a3418', '#8a5428', '#b47a3c'), glass: palette('#3c7cc0', '#5ea8e0', '#d8f0fc'), brick: palette('#8a4a2c', '#ac6640', '#cc865a') }

export const ORANGE_HOUSE = { roof: palette('#c4561e', '#e4702a', '#f89848'), roofInk: hex('#5e2410'), ...CREAM_WALL, ...WINDOWS }
export const RUST_HOUSE = { roof: palette('#a8401e', '#c8562a', '#e47a48'), roofInk: hex('#4e1c10'), ...CREAM_WALL, ...WINDOWS }
export const AMBER_HOUSE = { roof: palette('#cc7a1c', '#e8962a', '#f8b84c'), roofInk: hex('#5c3410'), ...CREAM_WALL, ...WINDOWS }
export const CORAL_HOUSE = { roof: palette('#c44838', '#e0624a', '#f48c6c'), roofInk: hex('#5a1e18'), ...CREAM_WALL, ...WINDOWS }

/** Gimnasio eléctrico: paneles gris cálido, tejado naranja oscuro, amarillo eléctrico, cartel azul marino y cristal */
export const ELECTRIC_GYM = {
  wall: palette('#8a8478', '#aca496', '#c8c0b0', '#e2dccc'),
  ink: hex('#4a4438'),
  roof: palette('#9c4a22', '#bc5e2c', '#dc7c40'),
  roofInk: hex('#4a1e0e'),
  bolt: palette('#d89a10', '#f8cc28', '#fff4a8'),
  plate: palette('#1c2448', '#2e3a6c'),
  glass: palette('#2c4c7c', '#5e8ec4', '#d8ecfa'),
}

/** Tienda: casa de tejado coral con toldo a rayas naranjas y blancas */
export const SHOP = { house: { ...CORAL_HOUSE }, awning: { stripes: palette('#ec7a2a', '#fcf6ec'), shade: palette('#b4561a', '#dcc8b0') } }

/** Muelle: madera (contorno, sombra, base, luz y brillo), cuerda y hierro de los bolardos */
export const PIER = {
  wood: palette('#4a2c18', '#7a4a28', '#9c6436', '#bc8048', '#d8a064'),
  rope: palette('#a88a5a', '#e0c890'),
  iron: palette('#2a2c34', '#4a4e5c', '#767c8c'),
}
/** Boya: rojo (sombra, base y luz) y blanco (sombra y luz) */
export const BUOY = { red: palette('#b0401e', '#e0602a', '#f88a50'), white: palette('#c8ccd4', '#f6f8fa') }
/** Barca de remos: casco de madera (sombra, base, luz), borda clara y contorno */
export const BOAT = { hull: palette('#6a4228', '#8c5a36', '#b07a4c'), rim: palette('#e8d8c0', '#fcf4e8'), ink: hex('#3a2418') }

/** Barco de pasajeros: casco azul marino con franja roja, cubiertas blancas y chimeneas naranjas de remate negro */
export const LINER = {
  hull: palette('#141c38', '#1e2a52', '#28386c', '#3c5088'),
  stripe: palette('#a42c22', '#d8452e'),
  deck: palette('#8890a4', '#c4cad8', '#eef0f6', '#ffffff'),
  glass: hex('#3c6ab0'),
  funnel: palette('#c4561e', '#ec7a2a', '#22242c'),
}

/** Farolas de día: hierro oscuro cálido y cristal apagado, sin halo */
export const LAMP = {
  iron: palette('#2a221c', '#463a30', '#625244', '#8a7662'),
  light: palette('#c8b8a0', '#e8dcc8', '#faf4ea'),
  glow: TRANSPARENT,
}

/** Copas de los árboles: hueco, sombra, base, luz y brillo */
export const TREES = {
  leaves: { colors: palette('#1a5a30', '#257240', '#348c4a', '#52a854', '#78c464'), ink: hex('#123e22') },
  trunk: { colors: palette('#4a3022', '#6a4630', '#8a5e40', '#a87a54', '#c49670'), ink: hex('#2e1c14') },
}

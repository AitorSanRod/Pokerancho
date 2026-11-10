// Colores de Ciudad Celeste de día: el cielo del prado y el mar al fondo, casas blancas de tejados azules, el
// gimnasio acuático, la tienda de toldo a rayas, la casa del pescador, el canal con su muelle y calles de adoquín
// azulado. Cada rampa va de oscuro a claro.

import { hex, palette, TRANSPARENT } from '../../paint/pixmap'

export { FOAM, MID_WATER, NEAR_WATER, SAND } from '../sea/palette'

/** Césped: sombra, base, luz y brillo */
export const LAWN = palette('#48a446', '#5aba4c', '#72ca58', '#8cd868')

/** Adoquín azulado de la calle: sombra, base, luz y brillo; `MORTAR`, juntas */
export const PAVING = palette('#8a9ab4', '#9eacc4', '#aebcd2', '#c0cce0')
export const MORTAR = hex('#717f9a')
/** Bordillo: sombra, base y canto iluminado */
export const CURB = palette('#6a7894', '#a8b4c8', '#dce4f0')
/** Piedra del muelle y de las orillas del canal: junta, sombra, base, luz y brillo */
export const QUAY = palette('#4c5670', '#6e7a94', '#8e9ab2', '#b0bacc', '#d2d8e4')

const WHITE_WALL = { wall: palette('#93a0bc', '#bcc8dc', '#e0e8f2', '#f6f8fc'), wallInk: hex('#56627e') }
const WINDOWS = { wood: palette('#2e3c5c', '#44587e', '#6a80a8'), glass: palette('#2c6cb8', '#58a6e6', '#d8f0fc'), brick: palette('#5c6a86', '#7c8aa6', '#9eaac2') }

export const BLUE_HOUSE = { roof: palette('#2a5aae', '#3a76cc', '#5c98e6'), roofInk: hex('#14285a'), ...WHITE_WALL, ...WINDOWS }
export const TEAL_HOUSE = { roof: palette('#1a8290', '#25a0ac', '#4cc0c4'), roofInk: hex('#0c3e48'), ...WHITE_WALL, ...WINDOWS }
export const NAVY_HOUSE = { roof: palette('#263a7c', '#344e98', '#4c6ab8'), roofInk: hex('#121c42'), ...WHITE_WALL, ...WINDOWS }
export const SKY_HOUSE = { roof: palette('#3a86d2', '#52a2ea', '#82c2f6'), roofInk: hex('#1a3e70'), ...WHITE_WALL, ...WINDOWS }

/** Gimnasio acuático: paredes de azulejo claro, cúpula turquesa, friso de olas, cristal y emblema de gota */
export const WATER_GYM = {
  wall: palette('#8ea2c0', '#b8c8de', '#dce6f2', '#f4f8fc'),
  ink: hex('#4a5a7c'),
  dome: palette('#145a8a', '#1f78ac', '#2c98c8', '#52b8de', '#8cd8f0'),
  wave: palette('#2a66b8', '#4a90dc', '#8ac4f0'),
  glass: palette('#1e4c8e', '#3c86cc', '#a8dcf8'),
  emblem: palette('#e8eef6', '#2a6ec4', '#4ea0e8', '#d8f0ff'),
}

/** Tienda: casa de paredes blancas con toldo a rayas azules y blancas */
export const SHOP = { house: { ...BLUE_HOUSE }, awning: { stripes: palette('#2f6cc4', '#f4f8fc'), shade: palette('#1e4a8e', '#b8c6dc') } }

/** Casa del pescador: tablones de madera, tejado de pizarra azul, red colgada y salvavidas */
export const FISHER_HUT = {
  wood: palette('#5a3a26', '#7c5234', '#9c6c44', '#bc8a5c'),
  ink: hex('#3a2418'),
  roof: palette('#34466e', '#46608e', '#6280b0'),
  roofInk: hex('#1a2440'),
  glass: WINDOWS.glass,
  net: palette('#8a7a5a', '#c8b88e'),
  ring: palette('#b02c2c', '#e44a3c', '#f4f4f0'),
}

/** Barandilla del muelle: contorno, sombra, base y luz (hierro azul marino) */
export const RAILING = palette('#1c2648', '#2c3c6c', '#3e5490', '#6684c0')
/** Boya: rojo (sombra, base y luz) y blanco (sombra y luz) */
export const BUOY = { red: palette('#a42a2e', '#d6423a', '#f27464'), white: palette('#c4ccd8', '#f6f8fa') }
/** Ancla de hierro: contorno, sombra, base y luz */
export const ANCHOR = palette('#1a2034', '#2e3852', '#46526e', '#6e7c98')
/** Barca de remos: casco de madera (sombra, base, luz), borda clara y contorno */
export const BOAT = { hull: palette('#6a4228', '#8c5a36', '#b07a4c'), rim: palette('#c8d0dc', '#f2f4f8'), ink: hex('#3a2418') }

/** Faro: muro blanco y franjas azules (sombra y luz de cada una), linterna y cúpula */
export const LIGHTHOUSE = {
  white: palette('#b8c4d8', '#f2f6fa'),
  band: palette('#2a5aae', '#4078cc'),
  lantern: palette('#e8c040', '#fff2a8'),
  cap: palette('#1c2c5a', '#2e467e'),
}
/** Cabo del faro: hierba (sombra, base, luz) y roca (sombra, base, luz) */
export const HEADLAND = { grass: palette('#3c9a3a', '#58b444', '#78c858'), rock: palette('#5c6680', '#7a86a0', '#9ca6bc') }
/** Veleros lejanos: casco, vela (sombra y luz) y franja de la vela */
export const SAILBOAT = { hull: palette('#1e3a74', '#2e529a'), sail: palette('#c8d2e2', '#fafcff'), stripe: hex('#3a78d0') }

/** Farolas de día: hierro azul marino y cristal apagado, sin halo */
export const LAMP = {
  iron: palette('#1c2648', '#2c3c6c', '#3e5490', '#6684c0'),
  light: palette('#a8b8cc', '#d8e4ee', '#f4f8fc'),
  glow: TRANSPARENT,
}

/** Copas de los árboles: hueco, sombra, base, luz y brillo */
export const TREES = {
  leaves: { colors: palette('#1a5a3a', '#257248', '#348c54', '#52a85c', '#78c46c'), ink: hex('#123e2a') },
  trunk: { colors: palette('#4a3022', '#6a4630', '#8a5e40', '#a87a54', '#c49670'), ink: hex('#2e1c14') },
}

/** Gaviotas (Wingull): cuerpo, punta de las alas y pico */
export const GULL = { body: '#f6f8fc', tips: '#5a82c0', beak: '#f2b830' }

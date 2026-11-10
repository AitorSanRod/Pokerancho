// Colores de Monte Moon: cueva oscura iluminada solo por sus cristales. Cada roca tiene una rampa de 5 tonos (de
// oscuro a claro) y, encima, `lit`: los tonos azulados que solo alcanza la luz de un cristal (ver light.ts). `ink` es
// el contorno del lado de sombra.

import { hex, palette, TRANSPARENT } from '../../paint/pixmap'

/** Fondo de la cueva, de arriba (casi negro) a abajo */
export const GLOOM = palette('#0b0914', '#0f0c1c', '#141024', '#18142c', '#1d1834')

export const FAR_ROCK = {
  colors: palette('#18132c', '#201a38', '#282144', '#312950', '#3b325e'),
  lit: palette('#3a4478', '#4a6298'),
  ink: hex('#100c1e'),
}
export const MID_ROCK = {
  colors: palette('#201a36', '#2a2244', '#352c54', '#423866', '#504578'),
  lit: palette('#4a5890', '#5c78b0', '#789cce'),
  ink: hex('#151027'),
}
export const NEAR_ROCK = {
  colors: palette('#282140', '#352c52', '#443a66', '#56497a', '#6a5c90'),
  lit: palette('#5e70a8', '#7890c6', '#9cbce2'),
  ink: hex('#1a142c'),
}
/** Techo: la roca que tapa la parte de arriba de la pantalla */
export const CEILING = { colors: palette('#0b0814', '#110d1c', '#181326', '#201930', '#29203c'), ink: hex('#06040c') }

/** Cristales: borde, base, luz y brillo; sin halo (la luz la recibe la roca de alrededor) */
export const CRYSTAL = { colors: palette('#1f4f8f', '#3d8fd6', '#86d2f7', '#eafaff'), glow: TRANSPARENT }
export const FAR_CRYSTAL = { colors: palette('#22407a', '#3470b4', '#6aaee0', '#c4e8fa'), glow: TRANSPARENT }

/** Fósiles incrustados en la pared: sombra, hueso y luz */
export const FOSSIL = palette('#5a5270', '#857c98', '#ada5be')
/** Piedra Lunar: sombra, base y luz, y las motas doradas */
export const MOON_STONE = { colors: palette('#2e3456', '#4a5486', '#7480b8'), speck: hex('#f2e6a0'), ink: hex('#141728') }
/** Madera del cartel de la entrada */
export const WOOD = palette('#3e2414', '#5c3a20', '#7a5030', '#9a6c44', '#b88a5c')

/** Suelo: sombra, base, luz y brillo; charcos que reflejan los cristales */
export const FLOOR = palette('#211b34', '#2a2340', '#332b4c', '#3e355a')
export const FLOOR_INK = hex('#151022')
export const PUDDLE = palette('#1d2d58', '#335494', '#9cd0f4')

/** Gotas que caen del techo */
export const DROP = '#9cd0f4'

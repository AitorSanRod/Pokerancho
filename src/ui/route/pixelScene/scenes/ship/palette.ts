// Colores del pasillo del barco de pasajeros: pared crema, zócalo de caoba con pasamanos de latón, ojos de buey con
// el mar de día, puertas de camarote, moqueta roja con cenefa dorada y tarima de cubierta. Cada rampa va de oscuro a
// claro; el primer tono de las de madera y latón es el contorno del lado de sombra.

import { hex, palette, rgba } from '../../paint/pixmap'

/** Pared: sombra, base, luz y brillo */
export const WALL = palette('#d2c19c', '#e6d8b8', '#f0e6cf', '#f9f3e4')
/** Caoba del zócalo, las puertas y los muebles: contorno, sombra, base, luz y brillo */
export const MAHOGANY = palette('#4a2418', '#6a3424', '#874632', '#a35c42', '#bd7656')
/** Latón de ojos de buey, pasamanos, apliques y placas: contorno, sombra, base, luz y brillo */
export const BRASS = palette('#7a5418', '#a8792a', '#d4a640', '#ecc866', '#f8e4a0')
/** Jamba blanca de las puertas: sombra, base, luz y brillo */
export const FRAME = palette('#b8ab8c', '#d8ccb0', '#ece4d0', '#fbf7ee')

/** Cielo de fuera, del alto al horizonte */
export const OUTSIDE_SKY = palette('#4f9ee8', '#6db6f2', '#92cdf8', '#bfe4fc')
/** Mar de fuera: del fondo (oscuro) a la cresta de las olas */
export const OUTSIDE_SEA = palette('#1f6aa8', '#2f86c4', '#5aaee0', '#b4e2f6')
/** Nube de fuera: sombra y luz */
export const OUTSIDE_CLOUD = palette('#d4e8f8', '#ffffff')
/** Reflejo en el cristal */
export const GLARE = hex('#eaf6ff')

/** Moqueta: sombra, base, luz; cenefa dorada: sombra, base y luz */
export const CARPET = palette('#7a1c22', '#98262a', '#ad3232')
export const CARPET_GOLD = palette('#a0701e', '#d8aa44', '#f2d07a')
/** Tarima de cubierta: junta, sombra, tres tonos de tabla y brillo */
export const DECK = palette('#5a3820', '#7c5232', '#9a6a40', '#ab7848', '#bd8a54', '#d4a46a')

/** Salvavidas: sombra, rojo, blanco y su sombra */
export const LIFE_RING = palette('#8a2420', '#d0403a', '#f4f0e8', '#c8c0b0')
/** Cuerda del salvavidas */
export const ROPE = palette('#9a8058', '#d4bc8a')
/** Tulipa encendida de los apliques: borde, base y centro */
export const SCONCE_LIGHT = palette('#e8c470', '#fbe6a8', '#fff8e0')
/** Halo de los apliques sobre la pared */
export const SCONCE_GLOW = rgba('#fff0b8', 0.22)

/** Cojín de los bancos: sombra, base y luz */
export const CUSHION = palette('#2c4a7a', '#3c6aa4', '#5a8cc8')
/** Maletas: cada una, sombra, base y luz */
export const LUGGAGE = [palette('#6a4a2a', '#8e6a40', '#b08a58'), palette('#2e5a4a', '#3e7c64', '#5a9c80'), palette('#7a3a2a', '#a04e36', '#c0684a')]

/** Techo: sombra, base y luz */
export const CEILING = palette('#d8ccae', '#e8dec6', '#f2ecdc')
/** Sombra del techo sobre la pared, de las cosas sobre la moqueta y de los muebles */
export const CEILING_SHADOW = rgba('#5a4830', 0.12)
export const FLOOR_SHADOW = rgba('#3a1010', 0.22)

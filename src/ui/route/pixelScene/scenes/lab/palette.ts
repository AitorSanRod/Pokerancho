// Colores del laboratorio: paredes claras, zócalo menta, parqué de miel, ventanales con el cielo de día y muebles
// blancos y de madera. Cada rampa va de oscuro a claro; `ink` es el contorno del lado de sombra.

import { hex, palette, rgba } from '../../paint/pixmap'

/** Pared: sombra, base, luz y brillo */
export const WALL = palette('#c4bfb0', '#dcd8ca', '#ebe8dd', '#f6f4ec')
/** Zócalo de paneles: sombra, base, luz y brillo */
export const WAINSCOT = palette('#4f8c80', '#6aa898', '#88c2b2', '#acdccd')
/** Rodapié de madera oscura */
export const BASEBOARD = palette('#4e3220', '#6e4830', '#8a6040')

/** Parqué: junta, sombra, tres tonos de tabla y brillo */
export const PARQUET = palette('#6a3e20', '#8e5630', '#a86a3a', '#bf7f48', '#d39456', '#e6b070')

/** Marcos blancos de ventanas y puertas: sombra, base, luz y brillo */
export const FRAME = palette('#8b97a6', '#b6c2ce', '#dde5ed', '#f7fafd')
/** Cielo de fuera, del alto (más intenso) al horizonte */
export const OUTSIDE_SKY = palette('#4f9ee8', '#6db6f2', '#92cdf8', '#bfe4fc')
/** Árboles de fuera: sombra, base y luz */
export const OUTSIDE_TREES = palette('#3a8c54', '#55ab64', '#7fcc7a')
/** Nubes de fuera: sombra y luz */
export const OUTSIDE_CLOUD = palette('#d4e8f8', '#ffffff')
/** Reflejo en el cristal */
export const GLARE = hex('#e9f6ff')

/** Cristal de las puertas automáticas: sombra, base y luz */
export const GLASS = palette('#6aa4c4', '#92c4dc', '#c8e6f4')
/** Metal gris de puertas, máquinas y patas: contorno, sombra, base, luz y brillo */
export const METAL = palette('#4c5562', '#6f7b8b', '#97a3b2', '#c0cad6', '#e4eaf1')
/** Madera de puertas y estanterías: contorno, sombra, base y luz */
export const WOOD = palette('#5a3820', '#7c5232', '#9a6a40', '#b8854f')
/** Pomo dorado: sombra y luz */
export const BRASS = palette('#b0802a', '#f0c850')

/** Lomos de libros: cada par es base y sombra */
export const BOOKS = [
  palette('#d0544a', '#9e3a34'),
  palette('#4a82c8', '#335c94'),
  palette('#e8b440', '#b48428'),
  palette('#54a462', '#3a7846'),
  palette('#9466c0', '#6a4690'),
  palette('#ec8a52', '#b8623a'),
]

/** Pantallas de las máquinas: fondo, letras y brillo */
export const SCREEN = palette('#1c3640', '#4cc49a', '#9ef0cc')
/** Pilotos de colores de las máquinas */
export const LEDS = palette('#e8504a', '#f4c84a', '#5cd07a', '#58a8f0')

/** Maceta blanca de cerámica: sombra, base y luz */
export const POT = palette('#9aa1aa', '#cbd1d8', '#eef1f4')
/** Hojas de las plantas: contorno, sombra, base y luz */
export const LEAVES = palette('#2c6e3a', '#3c8e48', '#58ae58', '#84cc6e')

/** Techo: sombra, base y luz; moldura: sombra y luz */
export const CEILING = palette('#cdc8ba', '#dedace', '#ebe8de')
export const CORNICE = palette('#b2ac9c', '#faf8f2')
/** Lámparas colgantes: pantalla (sombra, base, luz), cable y bombilla */
export const LAMP = { shade: palette('#3b8576', '#56a594', '#7cc4b2'), cord: hex('#4a4a52'), bulb: hex('#fff3c4') }

/** Rayos de sol que entran por los ventanales, de más a menos intensos */
export const SUNBEAM = [0.2, 0.16, 0.12, 0.08, 0.05, 0.025].map((alpha) => rgba('#fff4cc', alpha))
/** Sombra de los muebles en el suelo */
export const FLOOR_SHADOW = rgba('#3a2010', 0.18)
/** Sombra del techo sobre la parte alta de la pared */
export const CEILING_SHADOW = rgba('#5a5040', 0.1)

/** Líquidos de los matraces */
export const LIQUIDS = palette('#5ac8e8', '#f07a9a', '#9ad860')

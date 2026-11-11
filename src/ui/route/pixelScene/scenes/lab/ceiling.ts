// Techo del laboratorio: franja lisa con moldura, una sombra suave sobre la pared y lámparas colgantes de cable
// de largos distintos, de tarde en tarde.

import { between, makeRng } from '../../paint/noise'
import { Pixmap } from '../../paint/pixmap'
import { CEILING, CEILING_SHADOW, CORNICE, LAMP } from './palette'

/** Alto de la franja del techo hasta la moldura, en píxeles de arte */
export const CEILING_HEIGHT = 18
/** Ancho de la tesela del techo */
const WIDTH = 540
/** Separación entre lámparas [mín, máx] */
const LAMP_GAP: [number, number] = [110, 190]
/** Largo del cable de las lámparas [mín, máx] */
const CORD: [number, number] = [6, 20]

export function ceiling(seed: number): Pixmap {
  const rng = makeRng(seed + 311)
  const pix = new Pixmap(WIDTH, CEILING_HEIGHT + CORD[1] + 12)
  pix.rect(0, 0, WIDTH, CEILING_HEIGHT, CEILING[1])
  pix.rect(0, CEILING_HEIGHT - 3, WIDTH, 1, CEILING[0])
  pix.rect(0, CEILING_HEIGHT - 2, WIDTH, 1, CORNICE[1])
  pix.rect(0, CEILING_HEIGHT - 1, WIDTH, 1, CEILING[2])
  pix.rect(0, CEILING_HEIGHT, WIDTH, 1, CORNICE[0])
  pix.rect(0, CEILING_HEIGHT + 1, WIDTH, 3, CEILING_SHADOW)
  for (let x = between(rng, 20, 60); x < WIDTH - 30; x += between(rng, ...LAMP_GAP)) lamp(pix, Math.round(x), Math.round(between(rng, ...CORD)))
  return pix
}

/** Lámpara de pantalla redonda colgada de un cable de `cord` filas */
function lamp(pix: Pixmap, cx: number, cord: number) {
  const top = CEILING_HEIGHT + 1
  pix.rect(cx - 2, top - 1, 5, 1, CORNICE[0])
  pix.rect(cx, top, 1, cord, LAMP.cord)
  const shadeTop = top + cord
  const rows = [2, 4, 5, 6, 6]
  rows.forEach((half, i) => {
    const y = shadeTop + i
    pix.rect(cx - half, y, half * 2 + 1, 1, LAMP.shade[1])
    pix.set(cx - half, y, LAMP.shade[2])
    pix.set(cx + half, y, LAMP.shade[0])
  })
  pix.rect(cx - 6, shadeTop + rows.length, 13, 1, LAMP.shade[0])
  pix.rect(cx - 1, shadeTop + rows.length, 3, 1, LAMP.bulb)
}

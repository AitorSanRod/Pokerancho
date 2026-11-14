// Techo del pasillo del barco: franja crema con moldura de caoba, vigas que asoman de tarde en tarde y plafones de
// latón entre ellas, con una sombra suave sobre la pared.

import { between, makeRng } from '../../paint/noise'
import { Pixmap } from '../../paint/pixmap'
import { BRASS, CEILING, CEILING_SHADOW, MAHOGANY, SCONCE_LIGHT } from './palette'

/** Alto de la franja del techo hasta la moldura, en píxeles de arte */
const CEILING_HEIGHT = 16
/** Ancho de la tesela del techo */
const WIDTH = 600
/** Separación entre vigas [mín, máx] */
const BEAM_GAP: [number, number] = [90, 140]
/** Ancho y alto de lo que asoma cada viga bajo la moldura */
const BEAM = { width: 8, drop: 5 }

export function shipCeiling(seed: number): Pixmap {
  const rng = makeRng(seed + 411)
  const pix = new Pixmap(WIDTH, CEILING_HEIGHT + BEAM.drop + 6)
  pix.rect(0, 0, WIDTH, CEILING_HEIGHT, CEILING[1])
  pix.rect(0, CEILING_HEIGHT - 4, WIDTH, 1, CEILING[0])
  pix.rect(0, CEILING_HEIGHT - 3, WIDTH, 1, MAHOGANY[4])
  pix.rect(0, CEILING_HEIGHT - 2, WIDTH, 2, MAHOGANY[2])
  pix.rect(0, CEILING_HEIGHT, WIDTH, 1, MAHOGANY[0])
  pix.rect(0, CEILING_HEIGHT + 1, WIDTH, 3, CEILING_SHADOW)
  const beams: number[] = []
  for (let x = between(rng, 10, 40); x < WIDTH - BEAM_GAP[0] / 2; x += between(rng, ...BEAM_GAP)) beams.push(Math.round(x))
  beams.forEach((x, i) => {
    beam(pix, x)
    const next = beams[i + 1] ?? WIDTH + beams[0]
    domeLight(pix, Math.round((x + BEAM.width + next) / 2))
  })
  return pix
}

/** Viga de caoba que baja del techo y asoma bajo la moldura */
function beam(pix: Pixmap, x: number) {
  pix.rect(x, 0, BEAM.width, CEILING_HEIGHT + BEAM.drop, MAHOGANY[2])
  pix.rect(x, 0, 1, CEILING_HEIGHT + BEAM.drop, MAHOGANY[3])
  pix.rect(x + BEAM.width - 1, 0, 1, CEILING_HEIGHT + BEAM.drop, MAHOGANY[0])
  pix.rect(x, CEILING_HEIGHT + BEAM.drop, BEAM.width, 1, MAHOGANY[0])
  pix.rect(x + 1, CEILING_HEIGHT + BEAM.drop + 1, BEAM.width, 2, CEILING_SHADOW)
}

/** Plafón: media esfera encendida bajo un aro de latón, pegada a la moldura */
function domeLight(pix: Pixmap, cx: number) {
  const y = CEILING_HEIGHT + 1
  pix.rect(cx - 4, y, 9, 1, BRASS[2])
  pix.rect(cx + 4, y, 1, 1, BRASS[0])
  pix.rect(cx - 3, y + 1, 7, 1, SCONCE_LIGHT[1])
  pix.rect(cx - 2, y + 2, 5, 1, SCONCE_LIGHT[1])
  pix.rect(cx - 1, y + 1, 2, 1, SCONCE_LIGHT[2])
  pix.set(cx + 3, y + 1, SCONCE_LIGHT[0])
  pix.set(cx + 2, y + 2, SCONCE_LIGHT[0])
}

// Pared del laboratorio: pared clara con zócalo de paneles y rodapié, y a lo largo de ella ventanales, puertas,
// estanterías, máquinas, pizarras y algún reloj. También los rayos de sol que entran por los ventanales.

import { bigWindow } from '../../elements/bigWindow'
import { bookcase } from '../../elements/bookcase'
import { glassDoor, woodDoor, type DoorPalette } from '../../elements/interiorDoors'
import { labMachine } from '../../elements/labMachine'
import { wallClock, whiteboard } from '../../elements/wallDecor'
import { between, makeRng } from '../../paint/noise'
import { Pixmap } from '../../paint/pixmap'
import { WALL_HEIGHT, WALL_WIDTH, WallItem, wallLayout, type Placed } from './layout'
import * as C from './palette'

/** Fila del suelo en la tesela de pared */
const GROUND = WALL_HEIGHT - 1
/** Fila de la moldura de arriba del zócalo */
const RAIL = GROUND - 24
/** Fila del alféizar de los ventanales */
const SILL = GROUND - 30
/** Alto de los ventanales (siguen por detrás del techo en pantallas bajas) */
const WINDOW_HEIGHT = 112
/** Distancia entre las juntas de los paneles del zócalo */
const PANEL = 18
/** Largo de los rayos de sol bajo el alféizar y cuánto se desplazan a la derecha por fila */
const BEAM = { length: 60, slope: 0.5 }

const DOOR: DoorPalette = { frame: C.FRAME, wood: C.WOOD, glass: C.GLASS, metal: C.METAL, brass: C.BRASS, led: C.LEDS[2] }
const MACHINE = { metal: C.METAL, screen: C.SCREEN, leds: C.LEDS }
const DECOR = { metal: C.METAL, markers: [C.LEDS[0], C.LEDS[3], C.BOOKS[3][1], C.BOOKS[4][1]] }
const WINDOW = { frame: C.FRAME, sky: C.OUTSIDE_SKY, trees: C.OUTSIDE_TREES, cloud: C.OUTSIDE_CLOUD, glare: C.GLARE }

/** Cielo del fondo: el color de la pared, por si una pantalla muy alta deja ver por encima de la tesela */
export function sky(height: number): Pixmap {
  const pix = new Pixmap(16, height)
  pix.rect(0, 0, 16, height, C.WALL[1])
  return pix
}

export function wall(seed: number): Pixmap {
  const rng = makeRng(seed + 302)
  const pix = new Pixmap(WALL_WIDTH, WALL_HEIGHT)
  pix.rect(0, 0, pix.w, RAIL, C.WALL[1])
  wainscot(pix)
  const layout = wallLayout(seed)
  for (const item of layout) paintItem(pix, rng, item)
  layout.forEach((item, i) => {
    const next = layout[i + 1]?.x ?? WALL_WIDTH + layout[0].x
    const gap = next - item.x - item.width
    if (gap > 22 && rng() < 0.35) wallClock(pix, DECOR, item.x + item.width + Math.round(gap / 2), GROUND - 84)
  })
  return pix
}

function wainscot(pix: Pixmap) {
  pix.rect(0, RAIL, pix.w, GROUND - RAIL, C.WAINSCOT[1])
  pix.rect(0, RAIL, pix.w, 1, C.WAINSCOT[3])
  pix.rect(0, RAIL + 1, pix.w, 1, C.WAINSCOT[2])
  pix.rect(0, RAIL + 2, pix.w, 1, C.WAINSCOT[0])
  for (let x = 0; x < pix.w; x += PANEL) {
    pix.rect(x, RAIL + 3, 1, GROUND - RAIL - 7, C.WAINSCOT[0])
    pix.rect(x + 1, RAIL + 3, 1, GROUND - RAIL - 7, C.WAINSCOT[2])
  }
  pix.rect(0, GROUND - 3, pix.w, 1, C.BASEBOARD[2])
  pix.rect(0, GROUND - 2, pix.w, 2, C.BASEBOARD[1])
  pix.rect(0, GROUND, pix.w, 1, C.BASEBOARD[0])
}

function paintItem(pix: Pixmap, rng: () => number, { kind, x, width }: Placed) {
  switch (kind) {
    case WallItem.Window:
      return bigWindow(pix, rng, WINDOW, { x, top: SILL - WINDOW_HEIGHT, width, sill: SILL, panes: width > 46 ? 3 : 2 })
    case WallItem.WoodDoor:
      return woodDoor(pix, DOOR, x, GROUND, width, 52)
    case WallItem.GlassDoor:
      return glassDoor(pix, DOOR, x, GROUND, width, 54)
    case WallItem.Bookcase:
      return bookcase(pix, rng, { wood: C.WOOD, books: C.BOOKS }, x, GROUND, width, Math.round(between(rng, 44, 58)))
    case WallItem.Machine:
      return labMachine(pix, rng, MACHINE, x, GROUND, width, Math.round(between(rng, 38, 46)))
    case WallItem.Whiteboard:
      return whiteboard(pix, rng, DECOR, x, GROUND - 70, width, 26)
  }
}

/**
 * Rayos de sol: bajan en diagonal desde el cristal de cada ventanal, cruzan la pared y el suelo y se apagan por tramos
 * antes de llegar a los pies del Pokémon. `floorHeight`: alto del suelo que queda debajo de la pared.
 */
export function sunbeams(seed: number, floorHeight: number): Pixmap {
  const pix = new Pixmap(WALL_WIDTH, WALL_HEIGHT + floorHeight)
  const step = BEAM.length / C.SUNBEAM.length
  for (const { kind, x, width } of wallLayout(seed)) {
    if (kind !== WallItem.Window) continue
    for (let d = 1; d < BEAM.length; d++) {
      const shift = Math.round(d * BEAM.slope)
      pix.rect(x + 3 + shift, SILL + d, width - 6, 1, C.SUNBEAM[Math.floor(d / step)])
    }
  }
  return pix
}

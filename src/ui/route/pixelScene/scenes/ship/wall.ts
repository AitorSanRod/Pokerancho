// Pared del pasillo del barco: crema arriba, zócalo de paneles de caoba con pasamanos de latón y rodapié, y a lo largo
// de ella tandas de ojos de buey, puertas de camarote numeradas, cuadros, salvavidas y apliques encendidos.

import { woodDoor, type DoorPalette } from '../../elements/interiorDoors'
import { porthole } from '../../elements/porthole'
import { doorPlate, lifeRing, sconce, seaPicture } from '../../elements/shipDecor'
import { insetBox } from '../../paint/box'
import { makeRng, type Rng } from '../../paint/noise'
import { Pixmap } from '../../paint/pixmap'
import { PORTHOLE_PITCH, ShipWallItem, WALL_HEIGHT, WALL_WIDTH, shipWallLayout, type Placed } from './layout'
import * as C from './palette'

/** Fila del suelo en la tesela de pared */
const GROUND = WALL_HEIGHT - 1
/** Fila de arriba del zócalo de caoba */
const RAIL = GROUND - 26
/** Fila del pasamanos de latón (sobre el zócalo) */
const HANDRAIL = RAIL - 3
/** Fila del centro de los ojos de buey y su radio */
const PORTHOLE = { y: GROUND - 64, r: 10 }
/** Ancho de los paneles del zócalo */
const PANEL = 20
/** Hueco mínimo entre dos cosas para colgar un aplique */
const SCONCE_GAP = 18
/** Primer número de camarote */
const FIRST_CABIN = 101

const DOOR: DoorPalette = { frame: C.FRAME, wood: C.MAHOGANY, glass: C.MAHOGANY.slice(1, 4), metal: C.BRASS, brass: C.BRASS.slice(1, 4), led: C.BRASS[4] }
const PORTHOLE_COLORS = { brass: C.BRASS, sky: C.OUTSIDE_SKY, sea: C.OUTSIDE_SEA, cloud: C.OUTSIDE_CLOUD, glare: C.GLARE }
const SCONCE = { brass: C.BRASS, light: C.SCONCE_LIGHT, glow: C.SCONCE_GLOW }
const PICTURE = { brass: C.BRASS, sky: C.OUTSIDE_SKY, sea: C.OUTSIDE_SEA, sail: C.FRAME.slice(2), hull: C.MAHOGANY }
const RING = { ring: C.LIFE_RING, rope: C.ROPE, brass: C.BRASS }

/** Cielo del fondo: el color de la pared, por si una pantalla muy alta deja ver por encima de la tesela */
export function sky(height: number): Pixmap {
  const pix = new Pixmap(16, height)
  pix.rect(0, 0, 16, height, C.WALL[1])
  return pix
}

export function shipWall(seed: number): Pixmap {
  const rng = makeRng(seed + 402)
  const pix = new Pixmap(WALL_WIDTH, WALL_HEIGHT)
  pix.rect(0, 0, pix.w, RAIL, C.WALL[1])
  wainscot(pix)
  const layout = shipWallLayout(seed)
  let cabin = FIRST_CABIN
  for (const item of layout) paintItem(pix, rng, item, item.kind === ShipWallItem.CabinDoor ? cabin++ : 0)
  layout.forEach((item, i) => {
    const next = layout[i + 1]?.x ?? WALL_WIDTH + layout[0].x
    const gap = next - item.x - item.width
    if (gap >= SCONCE_GAP) sconce(pix, SCONCE, item.x + item.width + Math.round(gap / 2), PORTHOLE.y - 6)
  })
  return pix
}

/** Zócalo de paneles de caoba hundidos, con pasamanos de latón encima y rodapié oscuro */
function wainscot(pix: Pixmap) {
  pix.rect(0, RAIL, pix.w, GROUND - RAIL, C.MAHOGANY[2])
  pix.rect(0, RAIL, pix.w, 1, C.MAHOGANY[4])
  pix.rect(0, RAIL + 1, pix.w, 1, C.MAHOGANY[3])
  for (let x = 0; x < pix.w; x += PANEL) insetBox(pix, x + 3, RAIL + 5, PANEL - 5, GROUND - RAIL - 10, [C.MAHOGANY[1], C.MAHOGANY[2], C.MAHOGANY[3]])
  pix.rect(0, GROUND - 3, pix.w, 1, C.MAHOGANY[1])
  pix.rect(0, GROUND - 2, pix.w, 2, C.MAHOGANY[0])
  pix.rect(0, GROUND, pix.w, 1, C.MAHOGANY[0])
  pix.rect(0, HANDRAIL, pix.w, 1, C.BRASS[4])
  pix.rect(0, HANDRAIL + 1, pix.w, 1, C.BRASS[2])
  pix.rect(0, HANDRAIL + 2, pix.w, 1, C.BRASS[0])
  pix.rect(0, HANDRAIL + 3, pix.w, 1, C.CEILING_SHADOW)
  for (let x = PANEL / 2; x < pix.w; x += PANEL * 3) {
    pix.rect(x, HANDRAIL + 3, 2, 2, C.BRASS[1])
    pix.set(x + 2, HANDRAIL + 3, C.BRASS[0])
  }
}

function paintItem(pix: Pixmap, rng: Rng, { kind, x, width }: Placed, cabin: number) {
  switch (kind) {
    case ShipWallItem.Portholes:
      for (let cx = x + PORTHOLE_PITCH / 2; cx < x + width; cx += PORTHOLE_PITCH) porthole(pix, rng, PORTHOLE_COLORS, cx, PORTHOLE.y, PORTHOLE.r)
      return
    case ShipWallItem.CabinDoor: {
      const height = 54
      woodDoor(pix, DOOR, x, GROUND, width, height)
      return doorPlate(pix, C.BRASS, x + Math.floor(width / 2), GROUND - height - 12, String(cabin))
    }
    case ShipWallItem.Picture:
      return seaPicture(pix, rng, PICTURE, x, PORTHOLE.y - 12, width, 24)
    case ShipWallItem.LifeRing:
      return lifeRing(pix, RING, x + width / 2, PORTHOLE.y + 2, 8)
  }
}

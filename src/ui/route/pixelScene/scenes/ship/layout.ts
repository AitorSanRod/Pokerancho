// Qué hay a lo largo de la pared del pasillo del barco y dónde: tandas de ojos de buey, puertas de camarote, cuadros
// y salvavidas, con apliques en los huecos que quedan entre ellos.

import { between, makeRng, type Rng } from '../../paint/noise'

export const ShipWallItem = {
  Portholes: 'portholes',
  CabinDoor: 'cabinDoor',
  Picture: 'picture',
  LifeRing: 'lifeRing',
} as const
export type ShipWallItem = (typeof ShipWallItem)[keyof typeof ShipWallItem]

export interface Placed {
  kind: ShipWallItem
  x: number
  width: number
}

/** Ancho de la tesela de pared: larga para que no se note la repetición */
export const WALL_WIDTH = 780
/** Alto de la tesela de pared, en píxeles de arte (cubre la pantalla más alta por encima del suelo) */
export const WALL_HEIGHT = 200
/** Separación entre los centros de dos ojos de buey de la misma tanda */
export const PORTHOLE_PITCH = 26

/** Probabilidad de cada cosa (pesos) y su ancho [mín, máx]; el de los ojos de buey sale de cuántos van en la tanda */
const ITEMS: [ShipWallItem, number, [number, number]][] = [
  [ShipWallItem.Portholes, 1.6, [0, 0]],
  [ShipWallItem.CabinDoor, 2.4, [24, 26]],
  [ShipWallItem.Picture, 0.9, [30, 40]],
  [ShipWallItem.LifeRing, 0.6, [20, 20]],
]
/** Separación entre dos cosas de la pared [mín, máx] (en los huecos anchos va un aplique) */
const GAP: [number, number] = [14, 34]
/** Margen a cada lado de la tesela para que la costura no junte dos cosas */
const EDGE = 8

function choose(rng: Rng, last: ShipWallItem | null): ShipWallItem {
  const allowed = ITEMS.filter(([kind]) => kind !== last)
  const total = allowed.reduce((s, [, w]) => s + w, 0)
  let r = rng() * total
  for (const [kind, weight] of allowed) if ((r -= weight) < 0) return kind
  return ShipWallItem.Portholes
}

function widthOf(rng: Rng, kind: ShipWallItem): number {
  if (kind === ShipWallItem.Portholes) return PORTHOLE_PITCH * (rng() < 0.6 ? 1 : 2)
  const [, , [min, max]] = ITEMS.find(([k]) => k === kind)!
  return Math.round(between(rng, min, max))
}

/** Cosas de la pared de izquierda a derecha, sin solaparse ni repetir la misma dos veces seguidas */
export function shipWallLayout(seed: number): Placed[] {
  const rng = makeRng(seed + 401)
  const placed: Placed[] = []
  let x = EDGE
  let last: ShipWallItem | null = null
  for (;;) {
    const kind = choose(rng, last)
    const width = widthOf(rng, kind)
    if (x + width > WALL_WIDTH - EDGE) break
    placed.push({ kind, x, width })
    x += width + Math.round(between(rng, ...GAP))
    last = kind
  }
  return placed
}

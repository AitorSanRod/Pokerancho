// Qué hay a lo largo de la pared del laboratorio y dónde: lo comparten la pared y los rayos de sol de las ventanas.

import { between, makeRng, type Rng } from '../../paint/noise'

export const WallItem = {
  Window: 'window',
  WoodDoor: 'woodDoor',
  GlassDoor: 'glassDoor',
  Bookcase: 'bookcase',
  Machine: 'machine',
  Whiteboard: 'whiteboard',
} as const
export type WallItem = (typeof WallItem)[keyof typeof WallItem]

export interface Placed {
  kind: WallItem
  x: number
  width: number
}

/** Ancho de la tesela de pared: larga para que no se note la repetición */
export const WALL_WIDTH = 720
/** Alto de la tesela de pared, en píxeles de arte (cubre la pantalla más alta por encima del suelo) */
export const WALL_HEIGHT = 200

/** Probabilidad de cada cosa (pesos) y su ancho [mín, máx] */
const ITEMS: [WallItem, number, [number, number]][] = [
  [WallItem.Window, 5, [40, 54]],
  [WallItem.WoodDoor, 1.2, [24, 26]],
  [WallItem.GlassDoor, 1, [34, 38]],
  [WallItem.Bookcase, 1.6, [28, 40]],
  [WallItem.Machine, 1.2, [24, 30]],
  [WallItem.Whiteboard, 0.8, [40, 50]],
]
/** Separación entre dos cosas de la pared [mín, máx] */
const GAP: [number, number] = [8, 30]
/** Margen a cada lado de la tesela para que la costura no junte dos cosas */
const EDGE = 6

function choose(rng: Rng, last: WallItem | null): WallItem {
  const allowed = ITEMS.filter(([kind]) => !(kind === last && kind !== WallItem.Window))
  const total = allowed.reduce((s, [, w]) => s + w, 0)
  let r = rng() * total
  for (const [kind, weight] of allowed) if ((r -= weight) < 0) return kind
  return WallItem.Window
}

/** Cosas de la pared de izquierda a derecha, sin solaparse; las ventanas tienden a ir de dos en dos */
export function wallLayout(seed: number): Placed[] {
  const rng = makeRng(seed + 301)
  const placed: Placed[] = []
  let x = EDGE
  let last: WallItem | null = null
  for (;;) {
    const kind: WallItem = last === WallItem.Window && placed.at(-2)?.kind !== WallItem.Window && rng() < 0.6 ? WallItem.Window : choose(rng, last)
    const [, , [min, max]] = ITEMS.find(([k]) => k === kind)!
    const width = Math.round(between(rng, min, max))
    if (x + width > WALL_WIDTH - EDGE) break
    placed.push({ kind, x, width })
    x += width + Math.round(kind === WallItem.Window && last !== WallItem.Window ? between(rng, 6, 10) : between(rng, ...GAP))
    last = kind
  }
  return placed
}

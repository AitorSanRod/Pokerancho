// Planos cercanos de Monte Moon: peñascos de tamaños y huecos variados junto al camino (nunca en fila), cascajo
// a lo largo del borde para que no quede una línea recta, racimos de cristales que alumbran las rocas de al lado,
// alguna Piedra Lunar y rocas oscuras en primer plano.

import { crag, crystals, spike } from '../../elements/rocks'
import { between, makeRng, type Rng } from '../../paint/noise'
import { Pixmap } from '../../paint/pixmap'
import { relight, type Light } from './light'
import { moonStone } from './pieces'
import { CEILING, CRYSTAL, NEAR_ROCK } from './palette'

/** Tesela de los peñascos, en píxeles de arte: ancha para que cristales y Piedras Lunares no se repitan a la vista */
const NEAR = { width: 760, height: 90 }
/** Hueco entre grupos de rocas: unas veces se juntan, otras hay un tramo vacío */
const GAP = [24, 150] as const
/** Probabilidad de que un grupo lleve cristales, una Piedra Lunar o una estalagmita detrás */
const CHANCE = { crystals: 0.28, moonStone: 0.12, spike: 0.4 }
/** Alcance de la luz de un racimo cercano, en veces su tamaño */
const LIGHT_REACH = 2.2
/** Piedrecitas sueltas por tesela a lo largo del borde del camino */
const RUBBLE = 70

export function nearRocks(seed: number): Pixmap {
  const rng = makeRng(seed + 11)
  const pix = new Pixmap(NEAR.width, NEAR.height)
  const groundY = pix.h - 1
  const lights: Light[] = []
  for (let x = between(rng, 10, 40); x < pix.w - 20; x += between(rng, ...GAP)) rockGroup(pix, rng, Math.round(x), groundY, lights)
  rubble(pix, rng, groundY)
  relight(pix, NEAR_ROCK, lights, seed + 12)
  return pix
}

/** Un grupo: peñasco de tamaño al azar (a veces dos juntos), algo hundido o adelantado, con sus extras */
function rockGroup(pix: Pixmap, rng: Rng, x: number, groundY: number, lights: Light[]) {
  const sink = Math.round(between(rng, 0, 5))
  const size = Math.round(between(rng, 12, 32))
  if (rng() < CHANCE.spike) spike(pix, x + between(rng, -10, 10), groundY - 4, Math.round(between(rng, 26, 58)), Math.round(between(rng, 10, 18)), NEAR_ROCK, false)
  if (rng() < CHANCE.crystals) {
    const crystalSize = Math.round(between(rng, 18, 32))
    const cx = x + between(rng, 8, 22)
    crystals(pix, rng, cx, groundY - sink - 2, crystalSize, CRYSTAL)
    lights.push({ x: cx, y: groundY - crystalSize / 2, r: crystalSize * LIGHT_REACH })
  }
  crag(pix, rng, x, groundY - sink, size, NEAR_ROCK)
  if (rng() < 0.35) crag(pix, rng, x + size * between(rng, 0.9, 1.4), groundY, Math.round(size * between(rng, 0.4, 0.7)), NEAR_ROCK)
  if (rng() < CHANCE.moonStone) moonStone(pix, rng, x - size * between(rng, 1, 1.5), groundY, Math.round(between(rng, 15, 19)))
}

/** Cascajo: piedrecitas a distintas alturas del borde, que rompen la línea donde las rocas tocan el camino */
function rubble(pix: Pixmap, rng: Rng, groundY: number) {
  const [, shade, base, light] = NEAR_ROCK.colors
  for (let i = 0; i < RUBBLE; i++) {
    const x = Math.round(rng() * pix.w)
    const y = groundY - Math.round(between(rng, 0, 3))
    const w = Math.round(between(rng, 2, 5))
    pix.rect(x, y - 1, w, 2, base)
    pix.set(x, y - 1, light)
    pix.set(x + w - 1, y, shade)
    pix.set(x + w, y, NEAR_ROCK.ink)
  }
}

/** Rocas oscuras, de tamaños distintos y de tarde en tarde, en primer plano */
export function foreground(seed: number): Pixmap {
  const rng = makeRng(seed + 13)
  const pix = new Pixmap(900, 30)
  for (const x of [90, 400, 680]) crag(pix, rng, x + between(rng, -40, 40), pix.h - 1, Math.round(between(rng, 10, 18)), CEILING)
  return pix
}

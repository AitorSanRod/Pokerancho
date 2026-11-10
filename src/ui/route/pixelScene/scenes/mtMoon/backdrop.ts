// Fondo de Monte Moon: casi negro, con dos paredes de roca a las que solo da luz algún racimo de cristales grande, y
// fósiles incrustados en la pared media. El techo con estalactitas tapa la parte de arriba (nunca se ve el cielo).

import { crystals, rockMass, spike } from '../../elements/rocks'
import { between, makeRng } from '../../paint/noise'
import { Pixmap, TRANSPARENT } from '../../paint/pixmap'
import { verticalGradient } from '../../paint/shade'
import { relight, type Light } from './light'
import { boneFossil, spiralFossil } from './pieces'
import { CRYSTAL, FAR_CRYSTAL, FAR_ROCK, GLOOM, MID_ROCK } from './palette'

/** Teselas anchas para que los cristales grandes salgan de tarde en tarde */
const FAR = { width: 600, height: 170, crystals: 2 }
const MID = { width: 520, height: 96, crystals: 2, fossils: 2 }
/** Roca que tiene que haber por encima de un fósil, en píxeles de arte */
const FOSSIL_MARGIN = 10
/** Alcance de la luz de un racimo, en veces su tamaño */
const LIGHT_REACH = 2.4

export function sky(height: number): Pixmap {
  const pix = new Pixmap(16, height)
  verticalGradient(pix, GLOOM, 0, height, 0)
  return pix
}

/** Puestos repartidos por la tesela, cada uno desplazado al azar dentro de su tramo (nunca en fila ni a la par) */
const spread = (rng: () => number, width: number, count: number) =>
  Array.from({ length: count }, (_, i) => Math.round((i + between(rng, 0.2, 0.8)) * (width / count)))

/** Pared del fondo, alta: casi a oscuras salvo alrededor de sus racimos de cristales, a distintas alturas */
export function farWall(seed: number): Pixmap {
  const rng = makeRng(seed + 2)
  const pix = new Pixmap(FAR.width, FAR.height)
  const p = () => rng() * Math.PI * 2
  rockMass(pix, 130, [[2, 22, p()], [5, 10, p()], [11, 3, p()]], FAR_ROCK.colors, seed)
  const lights: Light[] = []
  for (const x of spread(rng, FAR.width, FAR.crystals)) {
    const size = Math.round(between(rng, 20, 30))
    // Por encima de la pared media, que tapa la mitad de abajo
    const y = Math.round(between(rng, FAR.height * 0.28, FAR.height * 0.45))
    lights.push({ x, y: y - size / 2, r: size * LIGHT_REACH })
    crystals(pix, rng, x, y, size, FAR_CRYSTAL)
  }
  relight(pix, FAR_ROCK, lights, seed + 5)
  return pix
}

/** Pared intermedia, más baja y clara, con estalagmitas, fósiles y algún racimo que la alumbra */
export function midWall(seed: number): Pixmap {
  const rng = makeRng(seed + 3)
  const pix = new Pixmap(MID.width, MID.height)
  const p = () => rng() * Math.PI * 2
  rockMass(pix, 56, [[2, 16, p()], [4, 8, p()], [9, 3, p()]], MID_ROCK.colors, seed + 4)
  for (let x = between(rng, 10, 40); x < pix.w; x += between(rng, 60, 130))
    spike(pix, x, pix.h - 1, Math.round(between(rng, 14, 30)), Math.round(between(rng, 7, 12)), MID_ROCK, false)
  fossils(pix, rng)
  const lights: Light[] = []
  for (const x of spread(rng, MID.width, MID.crystals)) {
    const size = Math.round(between(rng, 18, 26))
    lights.push({ x, y: pix.h - size / 2, r: size * LIGHT_REACH })
    crystals(pix, rng, x, pix.h - 2, size, CRYSTAL)
  }
  relight(pix, MID_ROCK, lights, seed + 6)
  return pix
}

/** Fósiles a media altura de la pared, alternando caracola y espina, lejos de los extremos de la tesela */
function fossils(pix: Pixmap, rng: () => number) {
  spread(rng, pix.w, MID.fossils).forEach((x, i) => {
    let y = Math.round(between(rng, pix.h * 0.55, pix.h * 0.75))
    // Siempre dentro de la roca, con margen por encima
    while (pix.get(x, y - FOSSIL_MARGIN) === TRANSPARENT && y < pix.h - FOSSIL_MARGIN) y++
    if (i % 2 === 0) spiralFossil(pix, x, y, Math.round(between(rng, 5, 7)), MID_ROCK.ink)
    else boneFossil(pix, x, y, Math.round(between(rng, 13, 17)), MID_ROCK.ink)
  })
}

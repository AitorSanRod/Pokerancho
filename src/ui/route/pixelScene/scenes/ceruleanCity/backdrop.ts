// Fondo de Ciudad Celeste: el mar hasta el horizonte, un cabo verde con el faro de franjas azules, veleros pequeños
// que cruzan despacio y la orilla de arena detrás de las casas.

import { between, makeRng, periodicWave, type Rng } from '../../paint/noise'
import { Pixmap } from '../../paint/pixmap'
import { waterBand } from '../sea/water'
import { FOAM, HEADLAND, LIGHTHOUSE, MID_WATER, SAILBOAT, SAND } from './palette'

/** Faro a escala 1, en píxeles de arte: alto de la torre, ancho abajo y arriba, alto de cada franja y de la linterna */
const TOWER = { height: 18, base: 8, top: 5, band: 4, lantern: 3 }
/** Cabo: ancho y alto en píxeles de arte */
const CAPE = { width: 90, height: 9 }

/** Orilla: franja de arena de borde ondulado con la espuma de las olas arriba */
export function shore(seed: number): Pixmap {
  const pix = new Pixmap(480, 10)
  const top = (x: number) => Math.round(2 + periodicWave(x, pix.w, [[6, 1.2, seed], [2, 0.8, seed * 2]]))
  for (let x = 0; x < pix.w; x++) {
    pix.rect(x, top(x), 1, pix.h - top(x), SAND[1])
    pix.rect(x, top(x) + 2, 1, 1, SAND[2])
    pix.set(x, top(x), FOAM[1])
    pix.set(x, top(x) + 1, FOAM[0])
  }
  return pix
}

/** Mar lejano hasta el horizonte */
export const farSea = (seed: number) => waterBand(seed + 1, 480, 30, MID_WATER)

/** Cabo: loma redondeada de hierba sobre roca, más clara del lado de la luz, con espuma en la orilla */
function headland(pix: Pixmap, cx: number, waterY: number, width: number, height: number) {
  const half = width / 2
  for (let x = Math.round(cx - half); x <= cx + half; x++) {
    const u = (x - cx) / half
    const h = Math.round(height * Math.sqrt(Math.max(0, 1 - u * u)))
    if (h <= 0) continue
    const tone = u < -0.35 ? 2 : u > 0.4 ? 0 : 1
    for (let y = waterY - h; y <= waterY; y++) pix.set(x, y, y - (waterY - h) < Math.max(2, h * 0.55) ? HEADLAND.grass[tone] : HEADLAND.rock[tone])
    pix.set(x, waterY + 1, FOAM[1])
  }
}

/** Faro con la base en (`cx`, `groundY`): torre que se estrecha a franjas, balconcillo, linterna y cúpula */
function lighthouse(pix: Pixmap, cx: number, groundY: number) {
  for (let i = 0; i < TOWER.height; i++) {
    const half = Math.round((TOWER.base - (TOWER.base - TOWER.top) * (i / TOWER.height)) / 2)
    const y = groundY - i
    const striped = Math.floor(i / TOWER.band) % 2 === 1
    const [shade, light] = striped ? LIGHTHOUSE.band : LIGHTHOUSE.white
    pix.rect(cx - half, y, half * 2, 1, light)
    pix.rect(cx + half - 2, y, 2, 1, shade)
  }
  const top = groundY - TOWER.height
  pix.rect(cx - 5, top, 10, 1, LIGHTHOUSE.cap[1])
  pix.rect(cx - 3, top - TOWER.lantern, 6, TOWER.lantern, LIGHTHOUSE.lantern[1])
  pix.rect(cx + 1, top - TOWER.lantern, 2, TOWER.lantern, LIGHTHOUSE.lantern[0])
  pix.rect(cx - 3, top - TOWER.lantern, 1, TOWER.lantern, LIGHTHOUSE.cap[0])
  pix.rect(cx + 2, top - TOWER.lantern, 1, TOWER.lantern, LIGHTHOUSE.cap[0])
  pix.rect(cx - 4, top - TOWER.lantern - 1, 8, 1, LIGHTHOUSE.cap[1])
  pix.rect(cx - 2, top - TOWER.lantern - 2, 4, 1, LIGHTHOUSE.cap[1])
  pix.set(cx, top - TOWER.lantern - 3, LIGHTHOUSE.cap[0])
}

/** Cabo con el faro, apoyado en la línea del agua */
export function coast(): Pixmap {
  const pix = new Pixmap(640, 48)
  const waterY = pix.h - 2
  headland(pix, 470, waterY, CAPE.width, CAPE.height)
  lighthouse(pix, 462, waterY - CAPE.height + 1)
  return pix
}

/** Velero: casco bajo y vela triangular con una franja, más claro en el lado de la luz */
function sailboat(pix: Pixmap, rng: Rng, x: number, waterY: number) {
  const size = Math.round(between(rng, 6, 9))
  pix.rect(x - size + 2, waterY - 1, size * 2 - 3, 1, SAILBOAT.hull[1])
  pix.rect(x - size + 3, waterY, size * 2 - 5, 1, SAILBOAT.hull[0])
  for (let i = 1; i <= size + 2; i++) {
    const width = Math.round(((size + 2 - i) / (size + 2)) * size)
    pix.rect(x - width, waterY - 1 - i, width, 1, SAILBOAT.sail[1])
    pix.rect(x + 1, waterY - 1 - i, Math.max(0, Math.round(width * 0.6)), 1, SAILBOAT.sail[0])
    pix.set(x, waterY - 1 - i, SAILBOAT.hull[0])
  }
  pix.rect(x - Math.round(size * 0.6), waterY - 4, Math.round(size * 0.6), 1, SAILBOAT.stripe)
}

/** Dos o tres veleros sueltos por tesela (la capa se desplaza sola, como si navegaran) */
export function sailboats(seed: number): Pixmap {
  const rng = makeRng(seed + 7)
  const pix = new Pixmap(720, 16)
  for (const x of [90, 350, 560]) sailboat(pix, rng, x + Math.round(between(rng, -30, 30)), pix.h - 2)
  return pix
}

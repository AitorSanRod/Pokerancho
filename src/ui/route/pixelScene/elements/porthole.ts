// Ojo de buey: aro de latón con remaches y, dentro, el mar de día (cielo, alguna nube, horizonte y olas) con un
// reflejo en el cristal. Luz arriba a la izquierda: el aro se aclara por ese lado y se oscurece por el contrario.

import { disc } from '../paint/box'
import { between, type Rng } from '../paint/noise'
import { Pixmap, type Color } from '../paint/pixmap'

export interface PortholePalette {
  /** Latón: contorno, sombra, base, luz y brillo */
  brass: readonly Color[]
  /** Cielo, del alto al horizonte */
  sky: readonly Color[]
  /** Mar, del fondo a la cresta de las olas */
  sea: readonly Color[]
  /** Nube: sombra y luz */
  cloud: readonly Color[]
  glare: Color
}

/** Grosor del aro, en píxeles de arte */
const RING = 3
/** Remaches repartidos por el aro */
const RIVETS = 8

/** Ojo de buey de radio `r` (aro incluido) centrado en (`cx`, `cy`) */
export function porthole(pix: Pixmap, rng: Rng, p: PortholePalette, cx: number, cy: number, r: number) {
  const glass = r - RING
  pix.stamp(seaView(rng, p, glass), cx - glass, cy - glass)
  for (let dy = -r - 1; dy <= r + 1; dy++)
    for (let dx = -r - 1; dx <= r + 1; dx++) {
      const d = Math.sqrt(dx * dx + dy * dy)
      if (d > r + 0.5 || d <= glass + 0.5) continue
      const facing = (dx + dy) / Math.max(d, 1)
      const outer = d > r - 0.5
      pix.set(cx + dx, cy + dy, outer && facing > -0.2 ? p.brass[0] : facing < -0.5 ? p.brass[3] : facing > 0.5 ? p.brass[1] : p.brass[2])
    }
  for (let i = 0; i < RIVETS; i++) {
    const a = (i / RIVETS) * Math.PI * 2 + Math.PI / RIVETS
    const mid = r - RING / 2 - 0.5
    const x = Math.round(cx + Math.cos(a) * mid)
    const y = Math.round(cy + Math.sin(a) * mid)
    pix.set(x, y, p.brass[4])
    pix.set(x + 1, y + 1, p.brass[1])
  }
}

/** El mar visto por un cristal redondo de radio `r`, con lo de fuera del círculo transparente */
function seaView(rng: Rng, p: PortholePalette, r: number): Pixmap {
  const size = r * 2 + 1
  const view = new Pixmap(size, size, false)
  const horizon = r + 2
  for (let y = 0; y < size; y++) {
    const color = y < horizon ? p.sky[Math.min(p.sky.length - 1, Math.floor((y / horizon) * p.sky.length))] : p.sea[Math.min(2, Math.floor(((y - horizon) / (size - horizon)) * 3))]
    view.rect(0, y, size, 1, color)
  }
  view.rect(0, horizon, size, 1, p.sea[0])
  for (let y = horizon + 2; y < size; y += 2) {
    const x = Math.round(between(rng, 0, size - 4))
    view.rect(x, y, Math.round(between(rng, 2, 4)), 1, p.sea[3])
  }
  if (rng() < 0.6) {
    const cx = Math.round(between(rng, 3, size - 4))
    const cy = Math.round(between(rng, 3, horizon - 4))
    disc(view, cx, cy + 1, 2, p.cloud[0])
    disc(view, cx - 2, cy, 2, p.cloud[1])
    disc(view, cx + 1, cy - 1, 2, p.cloud[1])
  }
  for (let k = 0; k < 4; k++) view.set(2 + k, r - 1 - k, p.glare)
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) if ((x - r) ** 2 + (y - r) ** 2 > r * r + r * 0.6) view.set(x, y, 0)
  return view
}

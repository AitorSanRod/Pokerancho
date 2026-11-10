// Gaviotas (Wingull) que cruzan el cielo de tarde en tarde, aleteando y planeando, cada una a su altura.

import type { ParticleSystem } from '../../engine/types'
import { between, makeRng } from '../../paint/noise'
import { GULL } from './palette'

const GULLS = 3
/** Vuelan entre estas alturas sobre el borde inferior, en píxeles de arte */
const FLIGHT_BAND = [120, 200] as const
/** Velocidad propia, en píxeles de arte por segundo, y lo que les afecta el avance del camino (están lejos) */
const SPEED = [8, 16] as const
const PARALLAX = 0.2
/** Segundos de espera antes de que vuelva a aparecer una gaviota: [mín, máx] */
const WAIT = [4, 14] as const
/** Aletazos por segundo */
const FLAP = 5

/** Dibujo de la gaviota en sus dos posturas: `#` cuerpo, `t` punta del ala, `b` pico */
const POSES = [
  ['t.....t', '.#...#.', '..###b.'],
  ['.......', '..###b.', '.#...#.', 't.....t'],
]
const COLORS: Record<string, string> = { '#': GULL.body, t: GULL.tips, b: GULL.beak }

interface Gull {
  x: number
  y: number
  vx: number
  t: number
  wait: number
}

export function ceruleanParticles(seed: number): ParticleSystem {
  const rng = makeRng(seed + 50)
  const gulls: Gull[] = Array.from({ length: GULLS }, () => ({ x: 0, y: 0, vx: 0, t: 0, wait: between(rng, 0, WAIT[1]) }))
  const spawn = (g: Gull, width: number, height: number) => {
    const fromLeft = rng() < 0.5
    Object.assign(g, { x: fromLeft ? -8 : width + 8, y: height - between(rng, ...FLIGHT_BAND), vx: (fromLeft ? 1 : -1) * between(rng, ...SPEED), t: rng() * 10 })
  }
  return {
    update(dt, pathSpeed, width, height) {
      for (const g of gulls) {
        if (g.wait > 0) {
          g.wait -= dt
          if (g.wait <= 0) spawn(g, width, height)
          continue
        }
        g.t += dt
        g.x += (g.vx - pathSpeed * PARALLAX) * dt
        g.y += Math.sin(g.t * 1.3) * 2 * dt
        if (g.x < -10 || g.x > width + 10) g.wait = between(rng, ...WAIT)
      }
    },
    draw(ctx) {
      for (const g of gulls) {
        if (g.wait > 0) continue
        const gliding = Math.sin(g.t * 0.7) > 0.4
        const pose = POSES[gliding ? 0 : Math.floor(g.t * FLAP) % 2]
        const flip = g.vx < 0
        pose.forEach((line, dy) =>
          [...line].forEach((ch, dx) => {
            if (ch === '.') return
            ctx.fillStyle = COLORS[ch]
            ctx.fillRect(Math.round(g.x) + (flip ? 6 - dx : dx) - 3, Math.round(g.y) + dy - 2, 1, 1)
          }),
        )
      }
    },
  }
}

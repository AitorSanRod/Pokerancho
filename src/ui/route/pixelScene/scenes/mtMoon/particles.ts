// Gotas de Monte Moon: de tarde en tarde cae una gota del techo, que salpica al llegar al suelo. Viajan con el camino.

import type { ParticleSystem } from '../../engine/types'
import { between, makeRng } from '../../paint/noise'
import { DROP } from './palette'

/** Segundos entre una gota y la siguiente */
const EVERY = [1.4, 4] as const
/** Altura desde la que caen (bajo el techo) y a la que salpican (en el suelo, sobre el borde inferior), en píxeles de arte */
const FROM = [24, 46] as const
const LAND = [14, 60] as const
/** Aceleración de la caída, en píxeles de arte por segundo al cuadrado */
const GRAVITY = 140
/** Segundos que dura la salpicadura */
const SPLASH = 0.3

interface Drop {
  x: number
  y: number
  vy: number
  floor: number
  /** Segundos desde que tocó el suelo; null mientras cae */
  splash: number | null
}

export function mtMoonParticles(seed: number): ParticleSystem {
  const rng = makeRng(seed + 20)
  const drops: Drop[] = []
  let wait = between(rng, ...EVERY)

  return {
    update(dt, pathSpeed, width, height) {
      wait -= dt
      if (wait <= 0) {
        drops.push({ x: between(rng, 0, width), y: between(rng, ...FROM), vy: 0, floor: height - between(rng, ...LAND), splash: null })
        wait = between(rng, ...EVERY)
      }
      for (const d of drops) {
        d.x -= pathSpeed * dt
        if (d.splash !== null) d.splash += dt
        else {
          d.vy += GRAVITY * dt
          d.y += d.vy * dt
          if (d.y >= d.floor) Object.assign(d, { y: d.floor, splash: 0 })
        }
      }
      for (let i = drops.length - 1; i >= 0; i--) if ((drops[i].splash ?? 0) > SPLASH || drops[i].x < -4) drops.splice(i, 1)
    },
    draw(ctx) {
      ctx.fillStyle = DROP
      for (const d of drops) {
        const x = Math.round(d.x)
        const y = Math.round(d.y)
        if (d.splash === null) ctx.fillRect(x, y, 1, 2)
        else {
          const spread = 1 + Math.floor((d.splash / SPLASH) * 3)
          ctx.fillRect(x - spread, y - 1, 1, 1)
          ctx.fillRect(x + spread, y - 1, 1, 1)
        }
      }
    },
  }
}

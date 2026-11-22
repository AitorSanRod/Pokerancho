import type { TapChallenge, TapKind } from '../../data/incursionMoves'
import { seededRng } from '../core/random'
import { CRIT_RING_MS } from '../battle/critTiming'

// Los anillos de la ventana de toques: cuántos salen, dónde y cuándo se cierra cada uno (al azar, pero fijo para cada
// ventana y Pokémon, así cada móvil ve los suyos igual aunque se pinten de nuevo), y cómo se juzgan los toques. Se
// tocan en orden: cada toque cuenta para el primer anillo aún sin juzgar, y acierta si cae encima y a tiempo; si no,
// ese anillo falla. Un anillo que se cierra sin toque, también.

/** Milisegundos desde que se abre la ventana hasta que empieza a cerrarse el primer anillo */
export const RING_LEAD_MS = 400
/** Milisegundos entre el cierre de un anillo y el del siguiente, como poco y como mucho */
export const RING_GAP_MIN_MS = 650
export const RING_GAP_MAX_MS = 1_000
/** Milisegundos antes del cierre en los que un toque acierta */
export const RING_EARLY_MS = 200
/** Milisegundos después del cierre en los que un toque aún acierta */
export const RING_LATE_MS = 150
/** Márgenes de la zona donde salen (fracción del ancho y del alto de la escena) */
const SPOT_X = { min: 0.18, max: 0.82 }
const SPOT_Y = { min: 0.3, max: 0.7 }
/** Distancia mínima (en fracción de la escena) de un anillo al anterior, para que no salgan encima */
const MIN_SPREAD = 0.25
const SPREAD_TRIES = 8

/** Un anillo: dónde está (fracción de la escena, desde arriba a la izquierda) y a los cuántos ms de la ventana se cierra */
export interface RingSpot {
  x: number
  y: number
  at: number
}

/** Un toque: a los cuántos ms de la ventana y sobre qué anillo cayó (null: sobre ninguno) */
export interface RingTap {
  t: number
  ring: number | null
}

export type RingMark = 'hit' | 'miss' | null

type RingsChallenge = Extract<TapChallenge, { kind: typeof TapKind.Rings }>

const between = (rng: () => number, r: { min: number; max: number }) => r.min + rng() * (r.max - r.min)

function nextSpot(rng: () => number, prev: RingSpot | undefined, at: number): RingSpot {
  let spot = { x: between(rng, SPOT_X), y: between(rng, SPOT_Y), at }
  for (let i = 0; prev && i < SPREAD_TRIES && Math.hypot(spot.x - prev.x, spot.y - prev.y) < MIN_SPREAD; i++) {
    spot = { x: between(rng, SPOT_X), y: between(rng, SPOT_Y), at }
  }
  return spot
}

/** Los anillos del reto para la ventana de clave `key` (ver critTiming.ts › ringKey) */
export function ringLayout(ch: RingsChallenge, key: number): RingSpot[] {
  const rng = seededRng(key)
  const count = ch.min + Math.floor(rng() * (ch.max - ch.min + 1))
  const spots: RingSpot[] = []
  let at = RING_LEAD_MS + CRIT_RING_MS
  for (let i = 0; i < count; i++) {
    spots.push(nextSpot(rng, spots[i - 1], at))
    at += Math.round(between(rng, { min: RING_GAP_MIN_MS, max: RING_GAP_MAX_MS }))
  }
  return spots
}

/** Milisegundos de la ventana en que aparece un anillo (empieza a cerrarse) */
export const ringShowsAt = (spot: RingSpot): number => spot.at - CRIT_RING_MS

/** Cómo va cada anillo con esos toques a los `now` ms de la ventana: acertado, fallado o aún por tocar */
export function judgeRings(spots: RingSpot[], taps: RingTap[], now: number): RingMark[] {
  const marks: RingMark[] = spots.map(() => null)
  let i = 0
  const expire = (t: number) => {
    while (i < spots.length && t > spots[i].at + RING_LATE_MS) marks[i++] = 'miss'
  }
  for (const tap of [...taps].sort((a, b) => a.t - b.t)) {
    expire(tap.t)
    if (i >= spots.length) break
    marks[i] = tap.ring === i && tap.t >= spots[i].at - RING_EARLY_MS ? 'hit' : 'miss'
    i++
  }
  expire(now)
  return marks
}

export const ringHits = (marks: RingMark[]): number => marks.filter((m) => m === 'hit').length

/** Si ya se han juzgado todos los anillos */
export const ringsDone = (marks: RingMark[]): boolean => marks.every((m) => m !== null)

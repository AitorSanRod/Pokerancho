import { randInt, type Rng } from '../core/random'
import type { GameState, Run } from '../core/state'

// Bonificación de EXP de la ruta: de vez en cuando, caminando, aparece un objeto en la escena durante un momento. Si el
// jugador lo toca, durante un rato los combates dan más EXP y cada toque caminando da EXP.

/** Milisegundos reales caminando, como poco, hasta que aparece el objeto */
export const BOOST_SPAWN_MIN_MS = 4 * 60_000
/** Milisegundos reales caminando, como mucho, hasta que aparece el objeto */
export const BOOST_SPAWN_MAX_MS = 8 * 60_000
/** Milisegundos reales que se queda el objeto en la escena para tocarlo */
export const BOOST_VISIBLE_MS = 6_000
/** Milisegundos reales que dura la bonificación una vez tocado */
export const BOOST_DURATION_MS = 60_000
/** Multiplicador de la EXP de los combates que empiezan con la bonificación */
export const BOOST_EXP_MULT = 2
/** EXP que da cada toque caminando con la bonificación */
export const BOOST_TAP_EXP = 10

export interface ExpBoost {
  /** Milisegundos caminando que faltan para que aparezca el objeto */
  spawnInMs: number
  /** Milisegundos que le quedan al objeto en la escena; 0 si no está */
  visibleMs: number
  /** Dónde sale el objeto, de 0 (izquierda) a 1 (derecha) */
  spot: number
  /** Milisegundos que le quedan a la bonificación; 0 si no está activa */
  activeMs: number
}

export const newExpBoost = (rng: Rng = Math.random): ExpBoost => ({
  spawnInMs: randInt(BOOST_SPAWN_MIN_MS, BOOST_SPAWN_MAX_MS, rng),
  visibleMs: 0,
  spot: 0,
  activeMs: 0,
})

export const boostActive = (run: Run): boolean => run.boost.activeMs > 0

/** Pasa `ms` reales: se gastan la bonificación y el objeto; caminando sin ellos, se acerca el siguiente */
export function advanceExpBoost(run: Run, ms: number, rng: Rng = Math.random) {
  const b = run.boost
  b.activeMs = Math.max(0, b.activeMs - ms)
  b.visibleMs = Math.max(0, b.visibleMs - ms)
  if (run.phase !== 'walking' || b.activeMs > 0 || b.visibleMs > 0) return
  b.spawnInMs -= ms
  if (b.spawnInMs > 0) return
  b.visibleMs = BOOST_VISIBLE_MS
  b.spot = rng()
  b.spawnInMs = randInt(BOOST_SPAWN_MIN_MS, BOOST_SPAWN_MAX_MS, rng)
}

/** Tocar el objeto mientras está en la escena empieza la bonificación */
export function catchExpBoost(s: GameState): boolean {
  const b = s.run?.boost
  if (!b || b.visibleMs === 0) return false
  b.visibleMs = 0
  b.activeMs = BOOST_DURATION_MS
  return true
}


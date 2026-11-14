import { legSteps, route } from '../../data/maps'
import { randInt, type Rng } from '../core/random'
import type { GameState, Run } from '../core/state'

// Huevo Suerte: en algunas rutas aparece, una sola vez, en la escena mientras se camina. Si el jugador lo toca, va a la
// Mochila. Usarlo desde allí hace que la siguiente ruta entera dé más EXP en los combates y EXP con cada toque caminando.

/** Probabilidad (0–1) de que en una ruta aparezca un Huevo Suerte */
export const EGG_ROUTE_CHANCE = 0.1
/** Milisegundos reales caminando que se queda el huevo en la escena para tocarlo */
export const BOOST_VISIBLE_MS = 6_000
/** Multiplicador de la EXP de los combates de la ruta con el Huevo Suerte usado */
export const BOOST_EXP_MULT = 2
/** EXP que da cada toque caminando en la ruta con el Huevo Suerte usado */
export const BOOST_TAP_EXP = 10

/** Punto de la ruta donde sale el huevo: tramo (índice de la parada de la que se sale) y pasos dentro de él */
export interface EggSpot {
  stop: number
  steps: number
}

export interface ExpBoost {
  /** Dónde va a salir el huevo en esta ruta; null si no sale o ya salió */
  spawnAt: EggSpot | null
  /** Milisegundos caminando que le quedan al huevo en la escena; 0 si no está */
  visibleMs: number
  /** Dónde sale el huevo en la pantalla, de 0 (izquierda) a 1 (derecha) */
  spot: number
  /** Se ha cogido el huevo de esta ruta (ya está en la Mochila) */
  found: boolean
  /** La ruta va con un Huevo Suerte usado desde la Mochila: EXP ×BOOST_EXP_MULT y EXP por toque, toda la ruta */
  active: boolean
}

/** Sorteo del huevo de una ruta recién empezada: con EGG_ROUTE_CHANCE, en un punto al azar de algún tramo */
function rollEggSpot(routeId: string, path: string[], rng: Rng): EggSpot | null {
  if (path.length < 2 || rng() >= EGG_ROUTE_CHANCE) return null
  const stop = randInt(0, path.length - 2, rng)
  const steps = Math.floor(rng() * legSteps(route(routeId), path, stop + 1))
  return { stop, steps }
}

export const newExpBoost = (routeId: string, path: string[], active: boolean, rng: Rng = Math.random): ExpBoost => ({
  spawnAt: rollEggSpot(routeId, path, rng),
  visibleMs: 0,
  spot: 0,
  found: false,
  active,
})

export const boostActive = (run: Run): boolean => run.boost.active

/** Caminando, el huevo se queda en la escena: solo se gasta su tiempo mientras se camina */
export function advanceExpBoost(run: Run, walkingMs: number) {
  run.boost.visibleMs = Math.max(0, run.boost.visibleMs - walkingMs)
}

/** Tras caminar hasta `steps` pasos del tramo actual: si se ha llegado al sitio del huevo, aparece */
export function reachEggSpot(run: Run, steps: number, rng: Rng = Math.random) {
  const b = run.boost
  if (!b.spawnAt || b.spawnAt.stop !== run.stop || steps < b.spawnAt.steps) return
  b.spawnAt = null
  b.visibleMs = BOOST_VISIBLE_MS
  b.spot = rng()
}

/** Tocar el huevo mientras está en la escena lo guarda en la Mochila */
export function catchExpBoost(s: GameState): boolean {
  const b = s.run?.boost
  if (!b || b.visibleMs === 0) return false
  b.visibleMs = 0
  b.found = true
  s.luckyEggs += 1
  return true
}

/** Por qué no se puede usar un Huevo Suerte ahora (null si se puede) */
export function luckyEggBlocker(s: GameState): string | null {
  if (s.luckyEggs < 1) return 'No te quedan Huevos Suerte.'
  if (s.luckyEggArmed) return 'Ya hay un Huevo Suerte preparado para la próxima ruta.'
  return null
}

/** Gasta un Huevo Suerte de la Mochila: la próxima ruta que se empiece irá con la bonificación */
export function spendLuckyEgg(s: GameState): boolean {
  if (luckyEggBlocker(s)) return false
  s.luckyEggs -= 1
  s.luckyEggArmed = true
  return true
}

import { seededRng } from '../core/random'

// El toque crítico (rutas y raids): de vez en cuando, antes de un golpe del jugador, sale un anillo sobre el rival y
// se cierra justo cuando llega el golpe. Acierta un solo toque dado a tiempo; cualquier otro toque mientras se cierra
// el anillo o justo después lo hace fallar, para que tocar a lo loco no sirva. Si sale se decide con una clave fija de
// cada golpe, así siempre es igual aunque se vuelva a calcular.

/** Probabilidad de que un golpe del jugador lleve anillo */
export const CRIT_RING_CHANCE = 0.35
/** Milisegundos que tarda el anillo en cerrarse: un toque en ese tiempo, fuera de la ventana, hace fallar */
export const CRIT_RING_MS = 800
/** Milisegundos antes del cierre del anillo en los que un toque acierta */
export const CRIT_EARLY_MS = 150
/** Milisegundos después del cierre del anillo en los que un toque aún acierta */
export const CRIT_LATE_MS = 120

export type RingResult = 'crit' | 'fail' | null

/** Número fijo a partir de varias partes (texto o números): la clave de un golpe */
export function ringKey(...parts: (string | number)[]): number {
  let h = 2166136261
  for (const ch of parts.join('|')) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  return h >>> 0
}

/** Si el golpe de esa clave lleva anillo */
export const ringShown = (key: number): boolean => seededRng(key)() < CRIT_RING_CHANCE

/**
 * Cómo fue el anillo que se cierra en `at`, vigilado hasta `guardEnd` (los toques posteriores ya no cuentan): crítico
 * (un solo toque y a tiempo), fallo (tocó, pero no así) o nada (no tocó). Los tiempos, en ms del mismo reloj
 */
export function judgeRing(at: number, guardEnd: number, taps: number[]): RingResult {
  const around = taps.filter((t) => t >= at - CRIT_RING_MS && t < guardEnd)
  if (around.length === 0) return null
  const t = around[0]
  return around.length === 1 && t >= at - CRIT_EARLY_MS && t <= at + CRIT_LATE_MS ? 'crit' : 'fail'
}

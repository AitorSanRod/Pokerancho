import { useState } from 'react'
import type { RingResult } from '../../game/battle/critTiming'
import './tap-ring.css'

/** Lo que se adelanta la búsqueda del anillo (ms de juego): lo que puede tardar el siguiente tick (App.tsx › TICK_MS) */
export const RING_LOOKAHEAD_MS = 250

interface Props {
  /** Milisegundos reales que tarda en cerrarse */
  durationMs: number
  /**
   * Milisegundos reales hasta que empieza a cerrarse según el último tick; al montarse se descuenta lo que ha pasado
   * desde `lastTick` (negativo: ya empezó), para que la animación vaya en su punto aunque se pinte tarde
   */
  startsInMs: number
  lastTick: number
  result: RingResult
}

/**
 * Anillo del toque crítico (rutas y raids), sobre el rival o el jefe: se cierra hasta el borde del blanco; al tocar,
 * dice si fue crítico o fallo. Quien lo pinta le da una `key` por anillo, para que cada uno empiece su animación
 */
export function TapRing({ durationMs, startsInMs, lastTick, result }: Props) {
  const [delayMs] = useState(() => startsInMs - Math.max(0, Date.now() - lastTick))
  return (
    <div className={`tap-ring ${result ?? ''}`}>
      <span className="tap-ring-target" />
      {!result && <span className="tap-ring-closing" style={{ animationDuration: `${durationMs}ms`, animationDelay: `${delayMs}ms` }} />}
      {result && <span className="tap-ring-text">{result === 'crit' ? '¡Crítico!' : '¡Fallo!'}</span>}
    </div>
  )
}

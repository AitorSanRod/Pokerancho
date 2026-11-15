import { useState } from 'react'
import { MoveClass, moveClass, type IncursionMove } from '../../data/incursionMoves'
import { TAP_WINDOW_MS } from '../../game/incursion/tapWindow'

interface Props {
  /** El ataque que usará tu Pokémon este turno: dice cuántos toques hacen falta y qué mejora */
  move: IncursionMove
  /** La ventana (tramo y turno): al cambiar, la cuenta empieza de cero */
  windowKey: string
  msLeft: number
  /** Al llegar a los toques: se apunta en la partida (sin servidor) o se avisa al servidor */
  onGoal: () => void
}

/** Qué mejora al potenciar cada clase de ataque */
const GAIN: Record<MoveClass, string> = {
  [MoveClass.Damage]: 'de daño',
  [MoveClass.Heal]: 'de cura',
  [MoveClass.Status]: 'de daño y cura para el resto del grupo',
}

/**
 * Ventana de toques antes del turno del grupo: toda la escena es el botón. Con los toques de su ataque antes de que se
 * acabe el tiempo, lo potencia este turno
 */
export function TapPad({ move, windowKey: key, msLeft, onGoal }: Props) {
  const [count, setCount] = useState({ key, taps: 0 })
  const taps = count.key === key ? count.taps : 0
  const goal = move.tapGoal
  const done = taps >= goal

  const tap = () => {
    if (done) return
    const next = taps + 1
    setCount({ key, taps: next })
    if (next === goal) onGoal()
  }

  return (
    <button className={`incursion-tap-pad ${done ? 'done' : ''}`} onPointerDown={tap} aria-label="Toca para potenciar tu ataque">
      <span className="incursion-tap-title">{done ? '¡Ataque potenciado!' : '¡Toca rápido!'}</span>
      <span className="incursion-tap-count">
        {Math.min(taps, goal)}/{goal}
      </span>
      <span className="tiny">{done ? `+${Math.round(move.tapBonus * 100)}% ${GAIN[moveClass(move)]} este turno` : `Llega a ${goal} toques: +${Math.round(move.tapBonus * 100)}% ${GAIN[moveClass(move)]}`}</span>
      <span className="incursion-tap-time" style={{ width: `${Math.max(0, (msLeft / TAP_WINDOW_MS) * 100)}%` }} />
    </button>
  )
}

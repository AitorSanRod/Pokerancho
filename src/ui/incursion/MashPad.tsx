import { useState } from 'react'
import type { TapChallenge, TapKind } from '../../data/incursionMoves'
import { mashScore, partialGain } from '../../game/incursion/tapChallenge'
import { TAP_WINDOW_MS } from '../../game/incursion/tapWindow'
import type { TapPadProps } from './TapPad'
import { gainText } from './tapText'

interface Props extends TapPadProps {
  challenge: Extract<TapChallenge, { kind: typeof TapKind.Mash }>
}

/** Machacar: cada toque cuenta y la mejora sube a saltos según la parte de la meta conseguida */
export function MashPad({ move, challenge: ch, msLeft, onScore }: Props) {
  const [taps, setTaps] = useState(0)
  const score = mashScore(taps, ch.goal)
  const done = score >= 1

  const tap = () => {
    if (done) return
    const next = mashScore(taps + 1, ch.goal)
    setTaps(taps + 1)
    if (next > score) onScore(next, next >= 1)
  }

  return (
    <button className={`incursion-tap-pad ${done ? 'done' : ''}`} onPointerDown={tap} aria-label="Toca rápido para potenciar tu ataque">
      <span className="incursion-tap-title">{done ? '¡Ataque potenciado!' : '¡Toca rápido!'}</span>
      <span className="incursion-tap-count">
        {Math.min(taps, ch.goal)}/{ch.goal}
      </span>
      <span className="incursion-tap-meter" aria-hidden>
        <span style={{ width: `${score * 100}%` }} />
      </span>
      <span className="tiny">{score > 0 ? `${gainText(move, partialGain(ch, score))} este turno` : `Cuantos más toques, más mejora: hasta ${gainText(move, ch.bonus)}`}</span>
      <span className="incursion-tap-time" style={{ width: `${Math.max(0, (msLeft / TAP_WINDOW_MS) * 100)}%` }} />
    </button>
  )
}

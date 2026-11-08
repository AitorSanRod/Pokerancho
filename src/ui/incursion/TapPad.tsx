import { useState } from 'react'
import { act } from '../../game/core/store'
import type { ActiveIncursion } from '../../game/incursion/activeIncursion'
import { boostIncursionTap } from '../../game/incursion/incursionGame'
import { TAP_BONUS, TAP_GOAL, TAP_WINDOW_MS } from '../../game/incursion/tapWindow'
import { sendIncursionTap } from '../../net/incursionSync'

interface Props {
  a: ActiveIncursion
  leg: number
  turn: number
  msLeft: number
}

/**
 * Ventana de toques antes del turno del grupo: toda la escena es el botón. Con TAP_GOAL toques antes de que se acabe el
 * tiempo, tu Pokémon pega más este turno (sin servidor se apunta en la partida; con él, se avisa al servidor)
 */
export function TapPad({ a, leg, turn, msLeft }: Props) {
  const key = `${leg}:${turn}`
  const [count, setCount] = useState({ key, taps: 0 })
  const taps = count.key === key ? count.taps : 0
  const done = taps >= TAP_GOAL

  const tap = () => {
    if (done) return
    const next = taps + 1
    setCount({ key, taps: next })
    if (next < TAP_GOAL) return
    if (a.online) void sendIncursionTap(leg, turn)
    else act((s) => boostIncursionTap(s, Date.now()))
  }

  return (
    <button className={`incursion-tap-pad ${done ? 'done' : ''}`} onPointerDown={tap} aria-label="Toca para potenciar tu ataque">
      <span className="incursion-tap-title">{done ? '¡Ataque potenciado!' : '¡Toca rápido!'}</span>
      <span className="incursion-tap-count">
        {Math.min(taps, TAP_GOAL)}/{TAP_GOAL}
      </span>
      <span className="tiny">{done ? `+${Math.round(TAP_BONUS * 100)}% de daño este turno` : `Llega a ${TAP_GOAL} toques y tu ataque hará más daño`}</span>
      <span className="incursion-tap-time" style={{ width: `${Math.max(0, (msLeft / TAP_WINDOW_MS) * 100)}%` }} />
    </button>
  )
}

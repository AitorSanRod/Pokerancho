import { useState } from 'react'
import { createPortal } from 'react-dom'
import { incursionMove } from '../../data/incursionMoves'
import { findMon, type GameState } from '../../game/core/state'
import type { ActiveIncursion } from '../../game/incursion/activeIncursion'
import { PickSide, pickSide } from '../../game/incursion/movePicks'
import { monRepertoire } from '../../game/incursion/repertoire'
import { Bar, Sprite } from '../shared/common'
import { MovePicker } from './MovePicker'
import { choosePick, pickCandidates, type Pick } from './pickAction'
import type { SceneState } from './sceneState'
import '../shared/overlays.css'

interface Props {
  game: GameState
  a: ActiveIncursion
  scene: SceneState
  /** El ataque que lleva ahora (o el que tiene pendiente) */
  current: Pick
  onClose: () => void
}

/**
 * Cambiar en plena pelea el ataque de tu Pokémon y a quién lo dirige: rival o aliado según el ataque, o «Automático».
 * Vale desde el próximo turno y sigue así hasta que lo vuelvas a cambiar
 */
export function PickDialog({ game, a, scene, current, onClose }: Props) {
  const mon = findMon(game, a.uid)
  const [moveId, setMoveId] = useState(current.moveId)
  const [target, setTarget] = useState<string | null>(current.target)
  if (!mon) return null
  const side = pickSide(incursionMove(moveId))
  const candidates = pickCandidates(moveId, scene)
  const chosen = candidates.some((c) => c.id === target) ? target : null

  const save = () => {
    choosePick(a, { moveId, target: chosen })
    onClose()
  }

  return createPortal(
    <div className="confirm-overlay" onClick={onClose}>
      <div className="card incursion-pick" role="dialog" aria-modal="true" aria-label="Cambiar ataque" onClick={(e) => e.stopPropagation()}>
        <h3>Cambiar ataque</h3>
        <MovePicker moves={monRepertoire(mon)} selectedId={moveId} onSelect={setMoveId} />
        {side && (
          <>
            <div className="label">{side === PickSide.Foes ? '¿A qué rival?' : '¿A qué aliado?'}</div>
            <div className="incursion-pick-targets">
              <button className={`incursion-pick-target ${chosen === null ? 'selected' : ''}`} onClick={() => setTarget(null)}>
                <span className="small">Automático</span>
              </button>
              {candidates.map((c) => (
                <button key={c.id} className={`incursion-pick-target ${chosen === c.id ? 'selected' : ''}`} onClick={() => setTarget(c.id)}>
                  <Sprite id={c.speciesId} size={40} animated={false} shiny={c.shiny} />
                  <span className="tiny">{c.name}</span>
                  <Bar value={c.hp} max={c.maxHp} kind="hp" />
                </button>
              ))}
            </div>
          </>
        )}
        <p className="tiny muted">Vale desde el próximo turno y sigue así hasta que lo vuelvas a cambiar. Si el elegido cae o cambia la sala, vuelve a elegirse solo.</p>
        <div className="row gap confirm-actions">
          <button className="btn grow" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn primary grow" onClick={save}>
            Usar este ataque
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

import { useState } from 'react'
import { findMon, type GameState } from '../../game/core/state'
import { incursionMoveChoices } from '../../game/incursion/incursionLoadout'
import { BoxIcon } from '../shared/BoxIcon'
import { classMeta } from '../shared/moveText'
import { MoveBarMoves } from './MoveBarMoves'
import { PickDialog } from './PickDialog'
import { pickCandidates, pickNow, type FightPilot } from './pickAction'
import type { SceneState } from './sceneState'
import './move-bar.css'

/** Hasta cuántos posibles objetivos cabe al lado la pista de que también se puede tocar en la escena */
const TIP_ROOM = 3

/**
 * Barra de ataques, abajo sobre la escena: un toque cambia el ataque (y otro, a quién va) desde el próximo turno, sin
 * abrir nada. La «i» abre la lista con lo que hace cada uno
 */
export function MoveBar({ game, pilot, scene }: { game: GameState; pilot: FightPilot; scene: SceneState }) {
  const [info, setInfo] = useState(false)
  const mon = findMon(game, pilot.uid)
  const now = pickNow(pilot, scene)
  if (!mon || !now) return null
  const { applied, next } = now
  const changed = next.moveId !== applied.moveId || next.target !== applied.target
  const candidates = pickCandidates(next.moveId, scene)
  const target = candidates.some((c) => c.id === next.target) ? next.target : null

  const pickMove = (moveId: string) => {
    const keep = pickCandidates(moveId, scene).some((c) => c.id === target)
    pilot.choose({ moveId, target: keep ? target : null })
  }

  return (
    <div className="move-bar">
      <div className="move-bar-head">
        <strong>Tu ataque</strong>
        <span className={changed ? 'move-bar-next' : 'move-bar-hint'}>{changed ? 'Cambia en el próximo turno' : 'Toca otro para cambiarlo'}</span>
        <button className="move-bar-info" onClick={() => setInfo(true)} aria-label="Qué hace cada ataque">
          i
        </button>
      </div>
      <MoveBarMoves moves={incursionMoveChoices(mon)} selectedId={next.moveId} inUseId={applied.moveId} meta={classMeta} onPick={pickMove} />
      {candidates.length > 0 && (
        <div className="move-bar-targets">
          <span className="move-bar-to">Objetivo</span>
          <button className={`move-bar-target auto ${target === null ? 'selected' : ''}`} onClick={() => pilot.choose({ moveId: next.moveId, target: null })}>
            Auto
          </button>
          {candidates.map((c) => (
            <button key={c.id} className={`move-bar-target ${target === c.id ? 'selected' : ''}`} onClick={() => pilot.choose({ moveId: next.moveId, target: c.id })} aria-label={c.name}>
              <BoxIcon id={c.speciesId} />
            </button>
          ))}
          {candidates.length <= TIP_ROOM && <span className="move-bar-tip">o toca en la escena</span>}
        </div>
      )}
      {info && <PickDialog game={game} pilot={pilot} scene={scene} current={{ moveId: next.moveId, target }} onClose={() => setInfo(false)} />}
    </div>
  )
}

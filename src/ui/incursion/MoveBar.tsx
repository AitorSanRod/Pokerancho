import { useState } from 'react'
import { MoveClass, moveClass, type IncursionMove } from '../../data/incursionMoves'
import { TYPE_INFO } from '../../data/types'
import { findMon, type GameState } from '../../game/core/state'
import type { ActiveIncursion } from '../../game/incursion/activeIncursion'
import { monRepertoire } from '../../game/incursion/repertoire'
import { BoxIcon } from '../shared/BoxIcon'
import { CLASS_LABEL } from '../shared/moveText'
import { PickDialog } from './PickDialog'
import { choosePick, pickCandidates, pickNow } from './pickAction'
import type { SceneState } from './sceneState'
import './move-bar.css'

/** Hasta cuántos posibles objetivos cabe al lado la pista de que también se puede tocar en la escena */
const TIP_ROOM = 3

/** «Daño · Pot. 40»; los de estado, solo su clase */
const moveMeta = (mv: IncursionMove) => [CLASS_LABEL[moveClass(mv)], moveClass(mv) === MoveClass.Status ? '' : `Pot. ${mv.power}`].filter(Boolean).join(' · ')

/**
 * Barra de ataques, abajo sobre la escena: un toque cambia el ataque (y otro, a quién va) desde el próximo turno, sin
 * abrir nada. La «i» abre la lista con lo que hace cada uno
 */
export function MoveBar({ game, a, scene }: { game: GameState; a: ActiveIncursion; scene: SceneState }) {
  const [info, setInfo] = useState(false)
  const mon = findMon(game, a.uid)
  const now = pickNow(a, scene)
  if (!mon || !now) return null
  const { applied, next } = now
  const changed = next.moveId !== applied.moveId || next.target !== applied.target
  const candidates = pickCandidates(next.moveId, scene)
  const target = candidates.some((c) => c.id === next.target) ? next.target : null

  const pickMove = (moveId: string) => {
    const keep = pickCandidates(moveId, scene).some((c) => c.id === target)
    choosePick(a, { moveId, target: keep ? target : null })
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
      <div className="move-bar-moves">
        {monRepertoire(mon).map((mv) => (
          <button
            key={mv.id}
            className={`move-bar-move ${mv.id === next.moveId ? 'selected' : ''} ${mv.id === applied.moveId ? 'in-use' : ''}`}
            style={{ ['--type-color' as string]: TYPE_INFO[mv.type].color }}
            onClick={() => pickMove(mv.id)}
          >
            <span className="move-bar-type">{TYPE_INFO[mv.type].name}</span>
            <strong className="move-bar-name">{mv.name}</strong>
            <span className="move-bar-meta">{moveMeta(mv)}</span>
          </button>
        ))}
      </div>
      {candidates.length > 0 && (
        <div className="move-bar-targets">
          <span className="move-bar-to">Objetivo</span>
          <button className={`move-bar-target auto ${target === null ? 'selected' : ''}`} onClick={() => choosePick(a, { moveId: next.moveId, target: null })}>
            Auto
          </button>
          {candidates.map((c) => (
            <button key={c.id} className={`move-bar-target ${target === c.id ? 'selected' : ''}`} onClick={() => choosePick(a, { moveId: next.moveId, target: c.id })} aria-label={c.name}>
              <BoxIcon id={c.speciesId} />
            </button>
          ))}
          {candidates.length <= TIP_ROOM && <span className="move-bar-tip">o toca en la escena</span>}
        </div>
      )}
      {info && <PickDialog game={game} a={a} scene={scene} current={{ moveId: next.moveId, target }} onClose={() => setInfo(false)} />}
    </div>
  )
}

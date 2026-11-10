import type { CSSProperties } from 'react'
import { incursionMove } from '../../data/incursionMoves'
import { TYPE_INFO } from '../../data/types'
import type { SceneState } from './sceneState'

/** Eventos tras lanzar un ataque durante los que se sigue viendo su nombre (mientras se ven sus golpes) */
const BANNER_EVENTS = 3

/** El ataque que se está usando, arriba en el centro de la escena y del color de su tipo; debajo, quién lo usa */
export function MoveBanner({ scene }: { scene: SceneState }) {
  const { move, seq } = scene
  if (!move || seq - move.seq >= BANNER_EVENTS) return null
  const mv = incursionMove(move.moveId)
  const user = [...scene.party, ...scene.foes].find((m) => m.id === move.actor)
  return (
    <div key={move.seq} className="incursion-move-banner" style={{ ['--type-color' as string]: TYPE_INFO[mv.type].color } as CSSProperties}>
      <span className="incursion-move-name">{mv.name}</span>
      {user && <span className="incursion-move-user">{user.name}</span>}
    </div>
  )
}

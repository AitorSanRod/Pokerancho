import { useState } from 'react'
import { battleMove } from '../../data/learnsets'
import type { GameState } from '../../game/core/state'
import type { ActiveIncursion } from '../../game/incursion/activeIncursion'
import { PickDialog } from './PickDialog'
import type { SceneState } from './sceneState'

/** Lo que usa tu Pokémon ahora (y lo que usará desde el próximo turno, si lo has cambiado) y el botón para cambiarlo */
export function PickButton({ game, a, scene }: { game: GameState; a: ActiveIncursion; scene: SceneState }) {
  const [open, setOpen] = useState(false)
  const mine = scene.party.find((m) => m.id === a.uid)
  if (!mine?.moveId) return null
  const applied = a.orders.flatMap((o) => o.turns ?? []).findLast((t) => t.picks?.[a.uid])?.picks[a.uid]
  const current = a.pendingPick ?? { moveId: mine.moveId, target: applied?.target ?? null }
  const targetName = (id: string | null) => [...scene.party, ...scene.foes].find((m) => m.id === id)?.name
  const label = (moveId: string, target: string | null) => [battleMove(moveId).name, targetName(target)].filter(Boolean).join(' → ')

  return (
    <>
      <button className="btn incursion-pick-btn" onClick={() => setOpen(true)}>
        <span className="small">
          <strong>Tu ataque:</strong> {label(mine.moveId, applied?.target ?? null)}
        </span>
        {a.pendingPick && <span className="tiny incursion-pick-next">Desde el próximo turno: {label(a.pendingPick.moveId, a.pendingPick.target)}</span>}
        <span className="tiny muted">Toca para cambiar el ataque o a quién va</span>
      </button>
      {open && <PickDialog game={game} a={a} scene={scene} current={current} onClose={() => setOpen(false)} />}
    </>
  )
}

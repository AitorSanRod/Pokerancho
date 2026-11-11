import { useState } from 'react'
import { incursionMove } from '../../data/incursionMoves'
import { incursion } from '../../data/incursions'
import type { GameState } from '../../game/core/state'
import { incursionProgress, IncursionPhase, type ActiveIncursion } from '../../game/incursion/activeIncursion'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'
import { IncursionMenu, IncursionMenuPanel } from './IncursionMenu'
import { IncursionStage } from './IncursionStage'
import { IncursionStrip } from './IncursionStrip'
import { TapPad } from './TapPad'
import { IncursionSummary } from './IncursionSummary'
import { RegroupPanel } from './RegroupPanel'
import { sceneAt } from './sceneState'
import './incursion-view.css'

/**
 * La incursión en curso, como una ruta: la escena a pantalla completa y, encima, una cabecera con la sala, los
 * revivires, los PS de todos y el botón «Menú», que despliega tu ataque, el grupo, el daño, las pasivas y la retirada.
 * Reorganizar sale abajo, sobre la escena; el final, a pantalla completa
 */
export function IncursionView({ game, a }: { game: GameState; a: ActiveIncursion }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const inc = incursion(a.incursionId)
  const p = incursionProgress(a, game.lastTick)
  const scene = sceneAt(a, p)
  const members = p.record.legs[p.leg].next.members
  const room = inc.rooms[scene.room]
  const mine = scene.party.find((m) => m.id === a.uid)
  const myMonUp = !!mine && mine.hp > 0 && !mine.out
  const finished = p.phase === IncursionPhase.Finished

  return (
    <div className="screen incursion-view">
      <IncursionStage biome={inc.biome} scene={scene} uid={a.uid} overlay={p.tap && myMonUp && <TapPad a={a} move={incursionMove(a.pendingPick?.moveId ?? mine!.moveId!)} leg={p.leg} turn={p.tap.turn} msLeft={p.tap.msLeft} />} />
      <div className="incursion-hud">
        <header className="incursion-head">
          <span className="incursion-head-title small">
            <strong>{inc.name}</strong> · Sala {Math.min(scene.room + 1, inc.rooms.length)}/{inc.rooms.length}
            {room ? ` · ${room.name}` : ''}
          </span>
          <span className="incursion-revives" title="Revivires del grupo">
            <ItemIcon item={ICON.Revive} size={22} off={scene.revives === 0} /> ×{scene.revives}
          </span>
          <IncursionMenu open={menuOpen} onToggle={() => setMenuOpen((o) => !o)} />
        </header>
        <IncursionStrip party={scene.party} foes={scene.foes} uid={a.uid} />
        {p.phase === IncursionPhase.Waiting && <p className="incursion-hud-note">Esperando a los toques del grupo…</p>}
        {menuOpen && <IncursionMenuPanel game={game} a={a} p={p} scene={scene} canPick={myMonUp && !finished} finished={finished} />}
      </div>
      {p.phase === IncursionPhase.Regroup && (
        <div className="incursion-bottom-sheet">
          <RegroupPanel game={game} a={a} members={members} msLeft={p.regroupMsLeft} />
        </div>
      )}
      {finished && (
        <div className="incursion-finale">
          <IncursionSummary outcome={p.record.outcome} earned={p.record.earned} />
        </div>
      )}
    </div>
  )
}

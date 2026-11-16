import { useState } from 'react'
import { incursionMove } from '../../data/incursionMoves'
import { incursion } from '../../data/incursions'
import type { GameState } from '../../game/core/state'
import { incursionProgress, IncursionPhase, type ActiveIncursion } from '../../game/incursion/activeIncursion'
import { newDiscoveries } from '../../game/incursion/foeDiscovery'
import { freePrizeSpent, payableEarnings } from '../../game/incursion/freeIncursions'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'
import { IncursionMenu, IncursionMenuPanel } from './IncursionMenu'
import { IncursionStage } from './IncursionStage'
import { IncursionStrip } from './IncursionStrip'
import { act } from '../../store/store'
import { boostIncursionTap } from '../../game/incursion/incursionGame'
import { sendIncursionTap } from '../../net/incursionSync'
import { MoveBar } from './MoveBar'
import { incursionPilot, sceneTargeting } from './pickAction'
import { TapPad } from './TapPad'
import { IncursionSummary } from './IncursionSummary'
import { RegroupPanel } from './RegroupPanel'
import { sceneAt } from './sceneState'
import './incursion-view.css'

/**
 * La incursión en curso, como una ruta: la escena a pantalla completa y, encima, una cabecera con la sala, los
 * revivires, los PS de todos y el botón «Menú», que despliega el grupo, el daño, las pasivas y la retirada.
 * Abajo, la barra de ataques para cambiar el tuyo de un toque; reorganizar sale abajo, sobre la escena; el final, a pantalla completa
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
  const choosing = myMonUp && !finished && p.phase !== IncursionPhase.Regroup
  const pilot = incursionPilot(a)
  const tap = p.tap
  const onGoal = () => (a.online ? void sendIncursionTap(p.leg, tap!.turn) : act((s) => boostIncursionTap(s, Date.now())))
  const tapPad = tap && myMonUp && <TapPad move={incursionMove(a.pendingPick?.moveId ?? mine!.moveId!)} windowKey={`${p.leg}:${tap.turn}`} msLeft={tap.msLeft} onGoal={onGoal} />

  return (
    <div className="screen incursion-view">
      <IncursionStage biome={inc.biome} scene={scene} uid={a.uid} targeting={choosing && !tap ? sceneTargeting(pilot, scene) : null} overlay={tapPad} />
      <div className="incursion-hud">
        <header className="incursion-head">
          <span className="incursion-head-title small">
            <strong>{inc.name}</strong> · Sala {Math.min(scene.room + 1, inc.rooms.length)}/{inc.rooms.length}
            {room ? ` · ${room.name}` : ''}
          </span>
          <span className="incursion-revives" aria-label={`Revivires del grupo: ${scene.revives}`}>
            <ItemIcon item={ICON.Revive} size={22} off={scene.revives === 0} /> ×{scene.revives}
          </span>
          <IncursionMenu open={menuOpen} onToggle={() => setMenuOpen((o) => !o)} />
        </header>
        <IncursionStrip party={scene.party} foes={scene.foes} uid={a.uid} />
        {p.phase === IncursionPhase.Waiting && <p className="incursion-hud-note">Esperando a los toques del grupo…</p>}
        {menuOpen && <IncursionMenuPanel a={a} p={p} scene={scene} finished={finished} />}
      </div>
      {choosing && <MoveBar game={game} pilot={pilot} scene={scene} />}
      {p.phase === IncursionPhase.Regroup && (
        <div className="incursion-bottom-sheet">
          <RegroupPanel game={game} a={a} members={members} msLeft={p.regroupMsLeft} />
        </div>
      )}
      {finished && (
        <div className="incursion-finale">
          <IncursionSummary
            outcome={p.record.outcome}
            earned={payableEarnings(game, a.incursionId, p.record.earned)}
            discovered={newDiscoveries(game, p)}
            prizeSpent={freePrizeSpent(game, a.incursionId)}
          />
        </div>
      )}
    </div>
  )
}

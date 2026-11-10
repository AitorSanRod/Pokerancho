import { incursion } from '../../data/incursions'
import { TYPE_INFO } from '../../data/types'
import type { GameState } from '../../game/core/state'
import { incursionProgress, IncursionPhase, type ActiveIncursion } from '../../game/incursion/activeIncursion'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'
import { IncursionRoster } from './IncursionRoster'
import { IncursionStage } from './IncursionStage'
import { PickButton } from './PickButton'
import { TapPad } from './TapPad'
import { IncursionSummary } from './IncursionSummary'
import { RegroupPanel } from './RegroupPanel'
import { RetreatVote } from './RetreatVote'
import { sceneAt } from './sceneState'
import './incursion-view.css'

/** La incursión en curso: sala, revivires y pasivas; la escena, lo que pasa, el grupo y, según el momento, reorganizar o el final */
export function IncursionView({ game, a }: { game: GameState; a: ActiveIncursion }) {
  const inc = incursion(a.incursionId)
  const p = incursionProgress(a, game.lastTick)
  const scene = sceneAt(a, p)
  const members = p.record.legs[p.leg].next.members
  const moveOf = (id: string) => scene.party.find((m) => m.id === id)?.moveId ?? ''
  const room = inc.rooms[scene.room]
  const mine = scene.party.find((m) => m.id === a.uid)
  const myMonUp = !!mine && mine.hp > 0 && !mine.out

  return (
    <div className="screen scroll incursion-view">
      <header className="incursion-head">
        <div>
          <h3>{inc.name}</h3>
          <span className="tiny muted">
            Sala {Math.min(scene.room + 1, inc.rooms.length)} de {inc.rooms.length}
            {room ? ` · ${room.name}` : ''}
          </span>
        </div>
        <span className="incursion-revives" title="Revivires del grupo">
          <ItemIcon item={ICON.Revive} size={24} off={scene.revives === 0} /> ×{scene.revives}
        </span>
      </header>
      {scene.passives.length > 0 && (
        <div className="incursion-passives">
          {scene.passives.map((ps) => (
            <span key={ps.type} className="incursion-passive tiny" style={{ ['--type-color' as string]: TYPE_INFO[ps.type].color }}>
              {TYPE_INFO[ps.type].name} {ps.level}
            </span>
          ))}
        </div>
      )}
      <IncursionStage biome={inc.biome} scene={scene} uid={a.uid} overlay={p.tap && myMonUp && <TapPad a={a} leg={p.leg} turn={p.tap.turn} msLeft={p.tap.msLeft} />} />
      {p.phase === IncursionPhase.Waiting && <p className="small muted center">Esperando a los toques del grupo…</p>}
      {myMonUp && p.phase !== IncursionPhase.Finished && <PickButton game={game} a={a} scene={scene} />}
      {p.phase === IncursionPhase.Regroup && <RegroupPanel game={game} a={a} members={members} msLeft={p.regroupMsLeft} />}
      {p.phase === IncursionPhase.Finished && <IncursionSummary outcome={p.record.outcome} earned={p.record.earned} />}
      <IncursionRoster party={scene.party} foes={scene.foes} moveOf={moveOf} uid={a.uid} nicknames={a.online?.nicknames ?? {}} />
      {p.phase !== IncursionPhase.Finished && <RetreatVote a={a} />}
    </div>
  )
}

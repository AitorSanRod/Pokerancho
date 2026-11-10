import { incursionMove } from '../../data/incursionMoves'
import { incursion } from '../../data/incursions'
import { TYPE_INFO } from '../../data/types'
import type { GameState } from '../../game/core/state'
import { incursionProgress, IncursionPhase, type ActiveIncursion } from '../../game/incursion/activeIncursion'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'
import { Fold } from './Fold'
import { IncursionRoster } from './IncursionRoster'
import { IncursionStage } from './IncursionStage'
import { IncursionStrip } from './IncursionStrip'
import { PickButton } from './PickButton'
import { TapPad } from './TapPad'
import { IncursionSummary } from './IncursionSummary'
import { RegroupPanel } from './RegroupPanel'
import { RetreatVote } from './RetreatVote'
import { sceneAt } from './sceneState'
import './incursion-view.css'

/**
 * La incursión en curso, para verla sin scroll: una línea con la sala y los revivires, la escena casi a pantalla
 * completa, tu ataque y una franja con los PS de todos. Según el momento, reorganizar o el final; el detalle de cada
 * Pokémon, las pasivas y la retirada, plegados debajo
 */
export function IncursionView({ game, a }: { game: GameState; a: ActiveIncursion }) {
  const inc = incursion(a.incursionId)
  const p = incursionProgress(a, game.lastTick)
  const scene = sceneAt(a, p)
  const members = p.record.legs[p.leg].next.members
  const moveOf = (id: string) => scene.party.find((m) => m.id === id)?.moveId ?? ''
  const room = inc.rooms[scene.room]
  const mine = scene.party.find((m) => m.id === a.uid)
  const myMonUp = !!mine && mine.hp > 0 && !mine.out
  const finished = p.phase === IncursionPhase.Finished

  return (
    <div className="screen scroll incursion-view">
      <header className="incursion-head">
        <span className="incursion-head-title small">
          <strong>{inc.name}</strong> · Sala {Math.min(scene.room + 1, inc.rooms.length)}/{inc.rooms.length}
          {room ? ` · ${room.name}` : ''}
        </span>
        <span className="incursion-revives" title="Revivires del grupo">
          <ItemIcon item={ICON.Revive} size={22} off={scene.revives === 0} /> ×{scene.revives}
        </span>
      </header>
      <IncursionStage biome={inc.biome} scene={scene} uid={a.uid} overlay={p.tap && myMonUp && <TapPad a={a} move={incursionMove(a.pendingPick?.moveId ?? mine!.moveId!)} leg={p.leg} turn={p.tap.turn} msLeft={p.tap.msLeft} />} />
      {p.phase === IncursionPhase.Waiting && <p className="small muted center">Esperando a los toques del grupo…</p>}
      {myMonUp && !finished && <PickButton game={game} a={a} scene={scene} />}
      <IncursionStrip party={scene.party} foes={scene.foes} uid={a.uid} />
      {p.phase === IncursionPhase.Regroup && <RegroupPanel game={game} a={a} members={members} msLeft={p.regroupMsLeft} />}
      {finished && <IncursionSummary outcome={p.record.outcome} earned={p.record.earned} />}
      <Fold title="Grupo y rivales">
        <IncursionRoster party={scene.party} foes={scene.foes} moveOf={moveOf} uid={a.uid} nicknames={a.online?.nicknames ?? {}} />
      </Fold>
      {scene.passives.length > 0 && (
        <Fold title={`Pasivas del grupo (${scene.passives.length})`}>
          <div className="incursion-passives">
            {scene.passives.map((ps) => (
              <span key={ps.type} className="incursion-passive tiny" style={{ ['--type-color' as string]: TYPE_INFO[ps.type].color }}>
                {TYPE_INFO[ps.type].name} {ps.level}
              </span>
            ))}
          </div>
        </Fold>
      )}
      {!finished && (
        <Fold title="Retirada">
          <RetreatVote a={a} />
        </Fold>
      )}
    </div>
  )
}

import { legSteps, node, route } from '../../data/maps'
import type { GameState, OwnedMon, Run } from '../../game/core/state'
import { act } from '../../store/store'
import { tapRun } from '../../game/run/run'
import { boostActive, BOOST_TAP_EXP } from '../../game/run/expBoost'
import { landmarkInView } from '../../game/run/runLandmark'
import { tapBattle } from '../../game/run/tapCrit'
import { stepsPerMinute } from '../../game/team/stats'
import { LevelUpBurst } from '../shared/sheet/LevelUpBurst'
import { useLeveledTo } from '../shared/useLeveledTo'
import { formatMinutes } from '../shared/format'
import { battleFrame, fighterClass, statusClass } from './battleFrame'
import { CritRing } from './CritRing'
import { RouteBattle } from './RouteBattle'
import { HealStop } from './HealStop'
import { StopTrack } from './StopTrack'
import { ExpBoostBadge, ExpBoostSpawn } from './ExpBoost'
import { WalkScene } from './WalkScene'
import { pickRouteMove } from '../../game/run/runMove'
import { towerMoveBarRoom } from '../tower/towerMoveBarRoom'
import { trainerScene } from './gym/trainerScene'
import { RouteMoveBar } from './RouteMoveBar'
import { AbandonButton } from './AbandonButton'
import { RunSummary } from './RunSummary'
import './run.css'

/** En combate, tocar es para el crítico: no sale la flecha de los pasos */
function tapInBattle(): boolean {
  act((s) => tapBattle(s, Date.now()))
  return false
}

/** La ruta avanza sola: el Pokémon camina, se para a combatir (o a curarse) en cada parada y sigue hasta el final */
export function RunView({ game, run, mon }: { game: GameState; run: Run; mon: OwnedMon }) {
  const r = route(run.routeId)
  const spm = stepsPerMinute(mon)
  const battle = run.battleMsLeft > 0 && run.lastBattle ? run.lastBattle : null
  const frame = battle && battleFrame(battle, run.battleMsLeft)
  const walking = run.phase === 'walking' && !battle && !run.heal
  const boosted = boostActive(run)
  const lastStop = run.path.length - 1
  const playerClass = battle && frame ? fighterClass(battle, frame, 'player') : ''
  const defeated = run.phase === 'fainted' || playerClass === 'fainted'
  const ended = run.phase === 'complete' || run.phase === 'fainted'
  const inView = landmarkInView(run)
  const landmark = inView && { key: `${run.routeId}:${inView.stop}`, id: inView.landmark }
  // La barra de ataques va abajo mientras camina y combate (se cambia también en pleno combate)
  const moveBar = run.phase === 'walking'
  const trainer = battle ? trainerScene(run) : null
  const leveledTo = useLeveledTo(mon.level)

  return (
    <div
      className={`screen run ${defeated ? 'defeated' : ''} ${moveBar ? 'move-run' : ''}`}
      style={moveBar ? { ['--move-bar-room' as string]: `${towerMoveBarRoom(mon)}px` } : undefined}
    >
      <WalkScene
        biome={r.biome}
        speciesId={mon.speciesId}
        shiny={mon.shiny}
        moving={walking}
        speed={Math.min(1.8, Math.max(0.6, spm / 22))}
        walkerClass={battle && frame ? `battling ${playerClass} ${statusClass(frame.event.playerStatus)}` : run.heal ? 'healing' : ''}
        onStep={walking ? () => act(tapRun) : battle ? tapInBattle : undefined}
        floaterText={boosted ? `+${BOOST_TAP_EXP} EXP` : undefined}
        landmark={landmark}
        signText={r.name}
        walkerOverlay={leveledTo !== null && <LevelUpBurst key={leveledTo} level={leveledTo} />}
      >
        {battle && frame && (
          <RouteBattle
            record={battle}
            frame={frame}
            trainer={trainer}
            enemyOverlay={run.battleSetup && <CritRing record={battle} setup={run.battleSetup} msLeft={run.battleMsLeft} lastTick={game.lastTick} />}
          />
        )}
        {run.heal && <HealStop key={run.stop} heal={run.heal} />}
        {walking && run.boost.visibleMs > 0 && <ExpBoostSpawn spot={run.boost.spot} />}
      </WalkScene>

      <div className="run-hud">
        <div className="row between">
          <strong>{r.name}</strong>
          <span className="small">
            Parada {run.stop}/{lastStop}
          </span>
          {run.phase === 'walking' && <AbandonButton game={game} />}
        </div>
        {(boosted || run.boost.found) && <ExpBoostBadge active={boosted} />}
        <StopTrack run={run} />
        {/* En el combate de la última parada la ruta sigue 'walking' hasta que acaba, pero ya no hay tramo siguiente */}
        {run.phase === 'walking' && run.stop < lastStop && <LegProgress game={game} run={run} spm={spm} />}
      </div>

      {walking && <div className="tap-hint">{boosted ? `Cada toque: +${BOOST_TAP_EXP} EXP` : 'Toca para avanzar más rápido'}</div>}
      {run.heal && <div className="tap-hint">Parada de curación</div>}
      {battle && !frame?.ended && <div className="tap-hint">Atento: si sale un anillo sobre el rival, toca cuando se cierre</div>}

      {moveBar && <RouteMoveBar mon={mon} moveId={run.moveId} onPick={(id) => act((s) => pickRouteMove(s, id, Date.now()))} />}

      {ended && !battle && <RunSummary run={run} mon={mon} />}
    </div>
  )
}

function LegProgress({ game, run, spm }: { game: GameState; run: Run; spm: number }) {
  const r = route(run.routeId)
  const needed = legSteps(r, run.path, run.stop + 1)
  const remainingMin = (needed - run.steps) / (spm * game.timeScale)
  return (
    <div className="row between small">
      <span>
        Hacia <strong>{node(r, run.path[run.stop + 1]).name}</strong>
      </span>
      <span>~{formatMinutes(remainingMin)}</span>
    </div>
  )
}

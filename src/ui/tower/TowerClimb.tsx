import { useState } from 'react'
import type { GameState } from '../../game/core/state'
import { act } from '../../store/store'
import { abandonTower, isHealFloor, towerBetweenFloors, towerMon } from '../../game/tower/tower'
import { setTowerMove } from '../../game/tower/towerMoveSwitch'
import { TowerEnd } from '../../game/tower/towerRun'
import { catchTowerEgg } from '../../game/tower/towerEgg'
import { pastLevelCap, towerLevel } from '../../game/tower/towerFoes'
import { isPrizeFloor, nextPrizeFloor, towerPrize } from '../../game/tower/towerRewards'
import { towerBiome } from '../../game/tower/towerScenery'
import { towerWeekBest } from '../../game/tower/towerWeek'
import { giftText } from '../gift/giftText'
import { battleFrame, fighterClass, statusClass } from '../route/battleFrame'
import { ExpBoostBadge, ExpBoostSpawn } from '../route/ExpBoost'
import { useFoeShown } from '../route/foeReady'
import { RouteBattle } from '../route/RouteBattle'
import { WalkScene } from '../route/WalkScene'
import '../route/run.css'
import { ConfirmDialog } from '../shared/ConfirmDialog'
import { RouteMoveBar } from '../route/RouteMoveBar'
import { towerMoveBarRoom } from './towerMoveBarRoom'
import { TowerSummary } from './TowerSummary'

/**
 * La subida en curso, a pantalla completa como una ruta: escena, cabecera encima y, abajo, la barra de ataques de las
 * incursiones (el cambio vale desde su siguiente ataque). Sube sola, se mire o no: aquí solo se ve por dónde va. Al acabar,
 * como al final de una ruta: la escena se queda de fondo (en gris si cayó) y los premios pasan por encima
 */
export function TowerClimb({ game }: { game: GameState }) {
  const t = game.tower!
  const mon = towerMon(game)
  const current = t.battleMsLeft > 0 && t.lastBattle ? t.lastBattle : null
  // Si la imagen del rival aún no ha llegado, sigue paseando y el combate espera (foeReady.ts)
  const foeShown = useFoeShown(current?.enemy ?? null, 'tower')
  const walking = towerBetweenFloors(game) || !foeShown
  const [abandoning, setAbandoning] = useState(false)
  const ended = t.end !== null
  const battle = foeShown ? current : null
  const frame = battle && battleFrame(battle, t.battleMsLeft)
  const weekBest = towerWeekBest(game, game.lastTick)
  const prizeFloor = nextPrizeFloor(weekBest)
  const biome = towerBiome(t.floor)

  return (
    <div className={`screen run tower-climb ${t.end === TowerEnd.Fainted ? 'defeated' : ''}`} style={mon ? { ['--move-bar-room' as string]: `${ended ? 0 : towerMoveBarRoom(mon)}px` } : undefined}>
      {mon && (
        <WalkScene
          key={biome}
          biome={biome}
          speciesId={mon.speciesId}
          shiny={mon.shiny}
          moving={walking}
          speed={1}
          walkerClass={battle && frame ? `battling ${fighterClass(battle, frame, 'player')} ${statusClass(frame.event.playerStatus)}` : ''}
        >
          {battle && frame && <RouteBattle record={battle} frame={frame} />}
          {t.egg && !ended && <ExpBoostSpawn spot={t.egg.spot} onCatch={catchTowerEgg} />}
        </WalkScene>
      )}
      {/* Al cambiar de fondo, la escena nueva aparece con un fundido */}
      <div key={`fade-${biome}`} className="tower-fade" />

      <div className="run-hud">
        <div className="row between">
          <strong>Torre infinita</strong>
          <span className="small">
            Piso {t.floor} · rival Nv. {towerLevel(t.floor)}
          </span>
          {!ended && (
            <button className="btn ghost small hud-abandon" onClick={() => setAbandoning(true)}>
              Abandonar
            </button>
          )}
        </div>
        <span className="tiny muted">
          Esta semana: piso {weekBest} · Próximo premio: piso {prizeFloor} ({giftText(towerPrize(prizeFloor)!)})
        </span>
        {walking && <FloorNote game={game} />}
        {t.earned.eggs > 0 && <ExpBoostBadge active={false} />}
      </div>

      {!ended && <div className="tap-hint">{walking ? `Subiendo al piso ${t.floor}…` : 'Sigue subiendo sola aunque salgas, hasta que caiga'}</div>}

      {mon && !ended && (
        <RouteMoveBar mon={mon} moveId={t.moveId} onPick={(id) => act((s) => setTowerMove(s, id, Date.now()))} />
      )}

      {abandoning && !ended && (
        <ConfirmDialog title="¿Abandonar la torre?" confirmLabel="Abandonar" onConfirm={() => act(abandonTower)} onCancel={() => setAbandoning(false)}>
          La subida se acaba aquí: te quedas con lo ganado, sin el piso en el que está luchando. La próxima empezará desde
          el piso 1.
        </ConfirmDialog>
      )}

      {ended && <TowerSummary tower={t} mon={mon} />}
    </div>
  )
}

/** Lo que tiene de especial el siguiente piso */
function FloorNote({ game }: { game: GameState }) {
  const t = game.tower!
  const notes = [
    isPrizeFloor(t.floor) && t.floor > towerWeekBest(game, game.lastTick) && 'premio',
    isHealFloor(t.floor) && 'cura al ganar',
    pastLevelCap(t.floor) && 'el rival da un ticket suyo',
  ].filter(Boolean)
  return notes.length > 0 ? <span className="run-hud-note">Piso {t.floor}: {notes.join(' · ')}</span> : null
}

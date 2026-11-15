import { useState } from 'react'
import type { GameState } from '../../game/core/state'
import { act } from '../../store/store'
import { abandonTower, isHealFloor, setTowerMove, towerBetweenFloors, towerMon } from '../../game/tower/tower'
import { pastLevelCap, towerLevel } from '../../game/tower/towerFoes'
import { isPrizeFloor, nextPrizeFloor, towerPrize } from '../../game/tower/towerRewards'
import { towerBiome } from '../../game/tower/towerScenery'
import { giftText } from '../gift/giftText'
import { battleFrame, fighterClass, statusClass } from '../route/battleFrame'
import { ExpBoostBadge } from '../route/ExpBoost'
import { RouteBattle } from '../route/RouteBattle'
import { WalkScene } from '../route/WalkScene'
import '../route/run.css'
import { ConfirmDialog } from '../shared/ConfirmDialog'
import { TowerMoveBar } from './TowerMoveBar'
import { towerMoveBarRoom } from './towerMoveBarRoom'

/**
 * La subida en curso, a pantalla completa como una ruta: escena, cabecera encima y, abajo, la barra de ataques de las
 * incursiones (el cambio vale desde el siguiente piso). Sube sola, se mire o no: aquí solo se ve por dónde va
 */
export function TowerClimb({ game }: { game: GameState }) {
  const t = game.tower!
  const mon = towerMon(game)
  const walking = towerBetweenFloors(game)
  const [abandoning, setAbandoning] = useState(false)
  const battle = !walking && t.lastBattle ? t.lastBattle : null
  const frame = battle && battleFrame(battle, t.battleMsLeft)
  const prizeFloor = nextPrizeFloor(game.towerBest)
  const biome = towerBiome(t.floor)

  return (
    <div className="screen run tower-climb" style={mon ? { ['--move-bar-room' as string]: `${towerMoveBarRoom(mon)}px` } : undefined}>
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
          <button className="btn ghost small hud-abandon" onClick={() => setAbandoning(true)}>
            Abandonar
          </button>
        </div>
        <span className="tiny muted">
          Récord: piso {game.towerBest} · Próximo premio: piso {prizeFloor} ({giftText(towerPrize(prizeFloor)!)})
        </span>
        {walking && <FloorNote game={game} />}
        {t.earned.eggs > 0 && <ExpBoostBadge active={false} />}
      </div>

      <div className="tap-hint">{walking ? `Subiendo al piso ${t.floor}…` : 'Sigue subiendo sola aunque salgas, hasta que caiga'}</div>

      {mon && (
        <TowerMoveBar
          mon={mon}
          selectedId={t.moveId}
          inUseId={battle?.player.move?.id ?? null}
          hint="Toca otro para cambiarlo"
          onPick={(id) => act((s) => setTowerMove(s, id))}
        />
      )}

      {abandoning && (
        <ConfirmDialog title="¿Abandonar la torre?" confirmLabel="Abandonar" onConfirm={() => act(abandonTower)} onCancel={() => setAbandoning(false)}>
          La subida se acaba aquí: te quedas con lo ganado, sin el piso en el que está luchando. La próxima empezará desde
          el piso 1.
        </ConfirmDialog>
      )}
    </div>
  )
}

/** Lo que tiene de especial el siguiente piso */
function FloorNote({ game }: { game: GameState }) {
  const t = game.tower!
  const notes = [
    isPrizeFloor(t.floor) && t.floor > t.startBest && 'premio',
    isHealFloor(t.floor) && 'cura al ganar',
    pastLevelCap(t.floor) && 'el rival da un ticket suyo',
  ].filter(Boolean)
  return notes.length > 0 ? <span className="run-hud-note">Piso {t.floor}: {notes.join(' · ')}</span> : null
}

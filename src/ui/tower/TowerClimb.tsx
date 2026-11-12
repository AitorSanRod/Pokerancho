import { useCallback, useEffect, useState } from 'react'
import { species } from '../../data/species'
import { activeMon, type GameState } from '../../game/core/state'
import { act } from '../../game/core/store'
import {
  abandonTower,
  canContinueTower,
  isHealFloor,
  nextFloor,
  pickTowerMove,
  towerBetweenFloors,
  towerMon,
  towerMovePickDue,
} from '../../game/tower/tower'
import { pastLevelCap, towerLevel } from '../../game/tower/towerFoes'
import { isPrizeFloor, nextPrizeFloor, towerPrize } from '../../game/tower/towerRewards'
import { towerBiome } from '../../game/tower/towerScenery'
import { giftText } from '../gift/giftText'
import { battleFrame, fighterClass, statusClass } from '../route/battleFrame'
import { RouteBattle } from '../route/RouteBattle'
import { WalkScene } from '../route/WalkScene'
import '../route/run.css'
import { ConfirmDialog } from '../shared/ConfirmDialog'
import { TowerMovePick } from './TowerMovePick'

/** Milisegundos que camina entre un piso y el siguiente */
const FLOOR_GAP_MS = 700

/**
 * La subida en curso, a pantalla completa como una ruta: escena, cabecera encima y, abajo, seguir o elegir ataque. Entre
 * pisos, el siguiente sale solo mientras se mira. Al volver a la
 * pantalla (o tras pasar a segundo plano) queda parada hasta «Seguir subiendo»; cada pocos pisos, elegir ataque
 */
export function TowerClimb({ game }: { game: GameState }) {
  const t = game.tower!
  const mon = towerMon(game)
  const between = towerBetweenFloors(game)
  const pickDue = towerMovePickDue(game)
  const canGo = canContinueTower(game)
  // Al llegar a la pantalla con la torre esperando, no sigue sola: se retoma a mano
  const [paused, setPaused] = useState(between)
  const [abandoning, setAbandoning] = useState(false)
  const walking = between && canGo && !pickDue && !paused
  const pause = useCallback(() => setPaused(true), [])
  useNextFloor(walking, t.floor, pause)
  const battle = !between && t.lastBattle ? t.lastBattle : null
  const frame = battle && battleFrame(battle, t.battleMsLeft)
  const prizeFloor = nextPrizeFloor(game.towerBest)
  const biome = towerBiome(t.floor)

  return (
    <div className="screen run tower-climb">
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
          {between && (
            <button className="btn ghost small hud-abandon" onClick={() => setAbandoning(true)}>
              Abandonar
            </button>
          )}
        </div>
        <span className="tiny muted">
          Récord: piso {game.towerBest} · Próximo premio: piso {prizeFloor} ({giftText(towerPrize(prizeFloor)!)})
        </span>
        {between && <FloorNote game={game} />}
      </div>

      {battle && <div className="tap-hint">Si sales, el combate sigue y la torre te espera</div>}
      {walking && <div className="tap-hint">Subiendo al piso {t.floor}…</div>}

      {between && !walking && (
        <div className="tower-panel">
          {!canGo && <p className="notice small">{blockedText(game)}</p>}
          {canGo && pickDue && mon && (
            <TowerMovePick
              mon={mon}
              initialId={t.moveId}
              title={`Piso ${t.floor}: elige ataque`}
              confirmLabel="Seguir subiendo"
              onConfirm={(id) => {
                act((s) => {
                  pickTowerMove(s, id)
                  nextFloor(s)
                })
                setPaused(false)
              }}
            />
          )}
          {canGo && !pickDue && paused && (
            <button className="btn primary wide" onClick={() => setPaused(false)}>
              Seguir subiendo (piso {t.floor})
            </button>
          )}
        </div>
      )}

      {abandoning && (
        <ConfirmDialog title="¿Abandonar la torre?" confirmLabel="Abandonar" onConfirm={() => act(abandonTower)} onCancel={() => setAbandoning(false)}>
          La subida se acaba aquí: te quedas con lo ganado. La próxima empezará desde el piso 1.
        </ConfirmDialog>
      )}
    </div>
  )
}

/** Por qué no puede seguir: su Pokémon no es el compañero o está en una ruta */
function blockedText(game: GameState): string {
  const mon = towerMon(game)
  if (!mon) return 'El Pokémon que subía ya no está.'
  if (activeMon(game)?.uid !== mon.uid) return `Para seguir, ${species(mon.speciesId).name} tiene que ser tu compañero.`
  return 'Tu compañero está en una ruta: termínala para seguir subiendo.'
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

/** Con `go`, empieza el siguiente piso tras un paseo corto; pasar a segundo plano para (`onHidden`) en lugar de seguir */
function useNextFloor(go: boolean, floor: number, onHidden: () => void) {
  useEffect(() => {
    const hide = () => document.hidden && onHidden()
    document.addEventListener('visibilitychange', hide)
    return () => document.removeEventListener('visibilitychange', hide)
  }, [onHidden])
  useEffect(() => {
    if (!go) return
    const id = setTimeout(() => (document.hidden ? onHidden() : act(nextFloor)), FLOOR_GAP_MS)
    return () => clearTimeout(id)
  }, [go, floor, onHidden])
}

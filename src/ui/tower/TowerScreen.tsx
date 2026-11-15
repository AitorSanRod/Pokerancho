import { useState } from 'react'
import { activeMon, type GameState, type OwnedMon } from '../../game/core/state'
import { act } from '../../store/store'
import { startTower, towerBlocker, TOWER_HEAL_EVERY, TOWER_LAST_HEAL_FLOOR } from '../../game/tower/tower'
import { towerWeekBest } from '../../game/tower/towerWeek'
import { TOWER_LEVEL_CAP_FLOOR } from '../../game/tower/towerFoes'
import { towerMoveChoices } from '../../game/tower/towerMoves'
import { nextPrizeFloor, towerPrize } from '../../game/tower/towerRewards'
import { giftText } from '../gift/giftText'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'
import { TowerClimb } from './TowerClimb'
import { RouteMoveBar } from '../route/RouteMoveBar'
import './tower.css'

/**
 * Torre infinita: el compañero sube piso a piso contra rivales cada vez más fuertes hasta que cae.
 * Con una subida en curso o recién acabada (hasta cerrar sus premios), la subida a pantalla completa (TowerClimb); sin ella,
 * empezar otra
 */
export function TowerScreen({ game }: { game: GameState }) {
  if (game.tower) return <TowerClimb game={game} />
  return (
    <div className="screen scroll tower">
      <TowerHead game={game} />
      <TowerStart game={game} />
    </div>
  )
}

function TowerHead({ game }: { game: GameState }) {
  const prizeFloor = nextPrizeFloor(towerWeekBest(game, game.lastTick))
  return (
    <div className="card tower-head">
      <strong className="with-icon">
        <ItemIcon item={ICON.Tower} size={28} /> Torre infinita
      </strong>
      <span className="small">
        Récord: <strong>piso {game.towerBest}</strong> · Esta semana: <strong>piso {towerWeekBest(game, game.lastTick)}</strong>
      </span>
      <span className="tiny">
        Próximo premio: piso {prizeFloor} ({giftText(towerPrize(prizeFloor)!)})
      </span>
    </div>
  )
}

/** Empezar una subida con el compañero y el ataque elegido */
function TowerStart({ game }: { game: GameState }) {
  const mon = activeMon(game)
  const blocker = towerBlocker(game)
  if (blocker || !mon) return <p className="notice small">{blocker}</p>
  return (
    <>
      <div className="card tower-rules">
        <strong className="small">Cómo funciona</strong>
        <ul className="small">
          <li>El rival sube un nivel en cada piso.</li>
          <li>Cada piso da EXP y ₽; algunos, un premio la primera vez de cada semana (empieza de cero los lunes).</li>
          <li>
            Te curas cada {TOWER_HEAL_EVERY} pisos, hasta el {TOWER_LAST_HEAL_FLOOR}.
          </li>
          <li>Pasado el {TOWER_LEVEL_CAP_FLOOR}, rivales de todas partes, más fuertes en cada piso, y cada uno da un ticket suyo.</li>
          <li>Elige el ataque y cámbialo cuando quieras durante la subida, también en pleno combate: vale desde su siguiente ataque.</li>
          <li>Algunos rivales salen shiny: más fuertes, pero con mucha más EXP.</li>
          <li>A veces, al ganar un piso, sale un Huevo Suerte: tócalo antes de que se vaya para guardarlo en la Mochila.</li>
          <li>Sube sola aunque salgas o cierres la app, hasta que caiga o la abandones.</li>
        </ul>
      </div>
      <TowerBegin mon={mon} />
    </>
  )
}

/** Elegir el ataque con la barra de las incursiones y comenzar */
function TowerBegin({ mon }: { mon: OwnedMon }) {
  const [moveId, setMoveId] = useState(() => towerMoveChoices(mon)[0]?.id ?? '')
  return (
    <div className="tower-begin">
      <RouteMoveBar mon={mon} moveId={moveId} inline onPick={setMoveId} />
      <button className="btn primary wide" disabled={!moveId} onClick={() => act((s) => startTower(s, moveId))}>
        Comenzar
      </button>
    </div>
  )
}

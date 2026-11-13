import { useState } from 'react'
import { activeMon, type GameState, type OwnedMon } from '../../game/core/state'
import { act } from '../../game/core/store'
import { startTower, towerBlocker, towerMon, TOWER_HEAL_EVERY, TOWER_LAST_HEAL_FLOOR, towerActive } from '../../game/tower/tower'
import { towerWeekBest } from '../../game/tower/towerWeek'
import { TOWER_LEVEL_CAP_FLOOR } from '../../game/tower/towerFoes'
import { towerMoveChoices } from '../../game/tower/towerMoves'
import { nextPrizeFloor, towerPrize } from '../../game/tower/towerRewards'
import { giftText } from '../gift/giftText'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'
import { TowerClimb } from './TowerClimb'
import { TowerMoveBar } from './TowerMoveBar'
import { TowerSummary } from './TowerSummary'
import './tower.css'

/**
 * Torre infinita: el compañero sube piso a piso contra rivales cada vez más fuertes hasta que cae.
 * Sin subida en curso, los premios de la que acaba de terminar (hasta cerrarlos) y empezar otra; con ella, la subida a pantalla completa
 * (TowerClimb)
 */
export function TowerScreen({ game }: { game: GameState }) {
  const t = game.tower
  if (towerActive(game)) return <TowerClimb game={game} />
  return (
    <div className="screen scroll tower">
      <TowerHead game={game} />
      {t && <TowerSummary tower={t} mon={towerMon(game)} />}
      <TowerStart game={game} />
    </div>
  )
}

function TowerHead({ game }: { game: GameState }) {
  const prizeFloor = nextPrizeFloor(game.towerBest)
  return (
    <div className="card tower-head">
      <strong className="with-icon">
        <ItemIcon item={ICON.Tower} size={28} /> Torre infinita
      </strong>
      <span className="small">
        Récord: <strong>piso {game.towerBest}</strong> · Esta semana: <strong>piso {towerWeekBest(game, Date.now())}</strong>
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
          <li>Cada piso da EXP y ₽; algunos, un premio la primera vez.</li>
          <li>
            Te curas cada {TOWER_HEAL_EVERY} pisos, hasta el {TOWER_LAST_HEAL_FLOOR}.
          </li>
          <li>Pasado el {TOWER_LEVEL_CAP_FLOOR}, rivales de todas partes, más fuertes en cada piso, y cada uno da un ticket suyo.</li>
          <li>Elige el ataque y cámbialo cuando quieras durante la subida: vale desde el siguiente piso.</li>
          <li>Si sales, la torre te espera en el siguiente piso.</li>
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
      <TowerMoveBar mon={mon} selectedId={moveId} inUseId={null} hint="Toca uno para elegirlo" inline onPick={setMoveId} />
      <button className="btn primary wide" disabled={!moveId} onClick={() => act((s) => startTower(s, moveId))}>
        Comenzar
      </button>
    </div>
  )
}

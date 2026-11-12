import { Biome } from '../../data/maps'
import { activeMon, type GameState } from '../../game/core/state'
import { act } from '../../game/core/store'
import { leaveTower, startTower, TOWER_HEAL_EVERY, towerLevel } from '../../game/tower/tower'
import { battleFrame } from '../route/battleFrame'
import { RouteBattle } from '../route/RouteBattle'
import { WalkScene } from '../route/WalkScene'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'
import { BigAction } from '../shared/sheet/MonSheet'
import './tower.css'

/**
 * Torre infinita (solo en desarrollo, para probar la idea): el compañero sube piso a piso contra rivales cada vez más
 * fuertes hasta que cae. Arriba el piso y el récord; la escena es la de un combate de ruta
 */
export function TowerScreen({ game }: { game: GameState }) {
  const mon = activeMon(game)
  const t = game.tower
  const battle = t?.lastBattle && t.battleMsLeft > 0 ? t.lastBattle : null
  const frame = battle && battleFrame(battle, t!.battleMsLeft)

  return (
    <div className="screen tower">
      <div className="card tower-head">
        <div className="row between">
          <strong className="with-icon">
            <ItemIcon item={ICON.Tower} size={28} /> Torre infinita
          </strong>
          <span className="tag">Desarrollo</span>
        </div>
        <span className="small">
          Récord: <strong>piso {game.towerBest}</strong>
          {t && ` · Piso ${t.floor} (rival Nv. ${towerLevel(t.floor)})`}
        </span>
        <span className="tiny muted">Rivales al azar, un nivel más por piso; se cura cada {TOWER_HEAL_EVERY} pisos. Sin premios.</span>
      </div>
      {t && (
        <div className="tower-stage">
          <WalkScene biome={Biome.Cave} speciesId={mon?.speciesId} shiny={mon?.shiny} moving={!battle} speed={1}>
            {battle && frame && <RouteBattle record={battle} frame={frame} />}
          </WalkScene>
        </div>
      )}
      {t?.over && <p className="notice small center">Cayó en el piso {t.floor}.</p>}
      {!t || t.over ? (
        <BigAction icon={ICON.Tower} label={mon ? 'Subir a la torre' : 'Necesitas un compañero'} className="primary" disabled={!mon} onClick={() => act((s) => startTower(s))} />
      ) : (
        <button className="btn ghost wide" onClick={() => act(leaveTower)}>
          Salir de la torre
        </button>
      )}
    </div>
  )
}

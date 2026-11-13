import type { ReactNode } from 'react'
import type { Biome } from '../../data/maps'
import { EventKind } from '../../game/incursion/events'
import { BattleHud } from '../route/BattleHud'
import { WalkScene } from '../route/WalkScene'
import { MoveBanner } from './MoveBanner'
import type { SceneTargeting } from './pickAction'
import { eventLine, type SceneMon, type SceneState } from './sceneState'
import { StageFighter } from './StageFighter'
import { foeSpot, partySpot } from './stageSpots'
import '../route/battle.css'
import '../route/battle-callouts.css'
import '../route/status-fx.css'
import '../raid/raid-scene.css'
import './incursion-stage.css'

interface Props {
  biome: Biome
  scene: SceneState
  uid: string
  overlay?: ReactNode
  targeting?: SceneTargeting | null
}

/** Desfase del balanceo de cada Pokémon, para que no se muevan todos a la vez */
const IDLE_PHASE_S = 0.37
/** Eventos desde que empieza una sala con jefe durante los que se ve su aviso */
const BOSS_WARNING_EVENTS = 2

/** El rival cuyo marcador se ve: el que está en juego, o el jefe, o el primero que quede en pie */
function shownFoe(scene: SceneState): SceneMon | undefined {
  return scene.foes.find((f) => f.id === scene.focusFoe) ?? scene.foes.find((f) => f.boss) ?? scene.foes.find((f) => f.hp > 0)
}

/**
 * La sala que se está jugando, como un combate de ruta: el grupo a la izquierda y los rivales a la derecha, con el
 * marcador de tu Pokémon y el del rival en juego a sus pies, el destello del crítico y el aviso del jefe. Arriba en el
 * centro, el ataque que se usa; abajo, una línea con lo que pasa. Encima de todo, `overlay` (la ventana de toques).
 * Con `targeting`, tocar a un Pokémon lo hace objetivo de tu ataque
 */
export function IncursionStage({ biome, scene, uid, overlay, targeting }: Props) {
  const targetOf = (id: string) => (targeting?.ids.includes(id) ? { chosen: targeting.chosen === id, onPick: () => targeting.pick(id) } : undefined)
  const e = scene.current
  const mine = scene.party.find((m) => m.id === uid)
  const foe = shownFoe(scene)
  const crit = e?.kind === EventKind.Hit && e.crit
  const bossWarning = scene.foes.some((f) => f.boss) && scene.seq - scene.roomSeq < BOSS_WARNING_EVENTS
  const struck = (id?: string) => e?.kind === EventKind.Hit && e.target === id

  return (
    <div className="raid-stage incursion-stage">
      <WalkScene biome={biome} moving={scene.foes.length === 0} speed={1}>
        <div className="route-battle">
          {crit && <div key={`flash-${scene.seq}`} className="battle-flash" />}
          {scene.party.map((m, i) => (
            <StageFighter key={m.id} m={m} spot={partySpot(i)} side="party" mine={m.id === uid} scene={scene} idleDelay={-i * IDLE_PHASE_S} target={targetOf(m.id)} />
          ))}
          {scene.foes.map((m, i) => (
            <StageFighter key={m.id} m={m} spot={foeSpot(i, scene.foes.length)} side="foe" mine={false} scene={scene} idleDelay={-i * IDLE_PHASE_S} target={targetOf(m.id)} />
          ))}
          <MoveBanner scene={scene} />
          {bossWarning && <div className="boss-warning">¡Un jefe os corta el paso!</div>}
          {mine && (
            <div className="battle-hud-slot player">
              <BattleHud fighter={mine} hp={mine.out ? 0 : mine.hp} statuses={mine.statuses} struck={struck(mine.id)} />
            </div>
          )}
          {foe && (
            <div className={`battle-hud-slot enemy ${foe.boss ? 'boss' : ''}`}>
              <BattleHud fighter={foe} hp={foe.hp} statuses={foe.statuses} boss={foe.boss} struck={struck(foe.id)} />
            </div>
          )}
          <p className="incursion-caption">{eventLine(scene)}</p>
        </div>
      </WalkScene>
      {overlay}
    </div>
  )
}

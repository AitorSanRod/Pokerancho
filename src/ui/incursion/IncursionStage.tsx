import type { CSSProperties } from 'react'
import type { Biome } from '../../data/maps'
import { EventKind, type IncursionEvent } from '../../game/incursion/events'
import { HitEffect } from '../route/HitEffect'
import { WalkScene } from '../route/WalkScene'
import { Sprite } from '../shared/common'
import { partySpot } from '../raid/partySpot'
import { roundClass } from '../raid/roundClass'
import type { SceneMon, SceneState } from './sceneState'
import '../route/battle.css'
import '../raid/raid-scene.css'

const MON_SIZE = 84
const BOSS_SIZE = 150
/** Desfase del balanceo de cada Pokémon, para que no se muevan todos a la vez */
const IDLE_PHASE_S = 0.37

/** La sala que se está jugando: el paisaje de la incursión con el grupo a la izquierda y los rivales a la derecha */
export function IncursionStage({ biome, scene, uid }: { biome: Biome; scene: SceneState; uid: string }) {
  const e = scene.current
  return (
    <div className="raid-stage incursion-stage">
      <WalkScene biome={biome} moving={scene.foes.length === 0} speed={1}>
        <div className="route-battle">
          {scene.party.map((m, i) => (
            <StageMon key={m.id} m={m} index={i} side="party" mine={m.id === uid} e={e} seq={scene.seq} />
          ))}
          {scene.foes.map((m, i) => (
            <StageMon key={m.id} m={m} index={i} side="foe" mine={false} e={e} seq={scene.seq} />
          ))}
        </div>
      </WalkScene>
    </div>
  )
}

interface StageMonProps {
  m: SceneMon
  index: number
  side: 'party' | 'foe'
  mine: boolean
  e: IncursionEvent | null
  seq: number
}

function StageMon({ m, index, side, mine, e, seq }: StageMonProps) {
  const spot = partySpot(index, m.id)
  const down = m.hp === 0 || m.out
  const acting = e?.kind === EventKind.Move && e.actor === m.id
  const struck = e?.target === m.id && (e.kind === EventKind.Hit || e.kind === EventKind.Miss) ? e : null
  const healed = e?.target === m.id && e.kind === EventKind.Heal
  const fxType = struck?.kind === EventKind.Hit ? struck.type : undefined
  const style = {
    left: `${side === 'party' ? spot.left : 100 - spot.left}%`,
    bottom: `calc(var(--ground) + ${spot.rise}px)`,
    zIndex: spot.z,
    ['--spot-scale' as string]: spot.scale,
    ['--idle-delay' as string]: `${-index * IDLE_PHASE_S}s`,
  } as CSSProperties

  return (
    <div className={`raid-party-mon incursion-mon ${side} ${down ? 'down' : ''} ${mine ? 'mine' : ''}`} style={style}>
      {mine && <span className="raid-mine-tag">Tú</span>}
      {struck && (
        <span key={seq} className="battle-pop hit">
          {struck.kind === EventKind.Hit ? `-${struck.amount ?? 0}` : 'Fallo'}
        </span>
      )}
      {healed && (
        <span key={seq} className="battle-pop heal">
          +{e.amount}
        </span>
      )}
      {fxType && <HitEffect key={`fx-${seq}`} type={fxType} />}
      <div className={acting ? roundClass(seq, side === 'party' ? 'raid-lunge' : 'raid-boss-lunge') : ''}>
        <div className={struck ? roundClass(seq, 'raid-shake') : ''}>
          <div className={down ? '' : 'raid-idle'}>
            <Sprite id={m.speciesId} size={m.boss ? BOSS_SIZE : MON_SIZE} />
          </div>
        </div>
      </div>
    </div>
  )
}


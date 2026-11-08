import type { CSSProperties } from 'react'
import { battleMove } from '../../data/learnsets'
import { STATUS_INFO } from '../../data/passives'
import { TYPE_INFO } from '../../data/types'
import { EventKind } from '../../game/incursion/events'
import { HitEffect } from '../route/HitEffect'
import { statusClass } from '../route/battleFrame'
import { roundClass } from '../raid/roundClass'
import { Sprite } from '../shared/common'
import type { SceneMon, SceneState } from './sceneState'
import { StagePop } from './StagePop'

/** Tamaño del sprite de cada uno: el tuyo algo mayor, los rivales como en la ruta y el jefe más grande */
const SIZE = { party: 84, mine: 96, foe: 104, boss: 150 }
/** Eventos tras lanzar un ataque durante los que se sigue viendo su nombre (sus golpes) */
const CALLOUT_EVENTS = 3

export interface Spot {
  left: number
  rise: number
  scale: number
  z: number
}

interface Props {
  m: SceneMon
  spot: Spot
  side: 'party' | 'foe'
  mine: boolean
  scene: SceneState
  /** Desfase del balanceo, para que no se muevan todos a la vez */
  idleDelay: number
}

/**
 * Un Pokémon de la incursión como los del combate de ruta: encima, el nombre del ataque que lanza (del color de su tipo)
 * y los números de lo que le pasa; el efecto del golpe; embiste al atacar, tiembla al recibir, el estado alterado se ve
 * en el sprite y, al caer, el rival se va y el del grupo se queda tumbado
 */
export function StageFighter({ m, spot, side, mine, scene, idleDelay }: Props) {
  const { current: e, seq, move } = scene
  const mineEvent = e?.target === m.id ? e : null
  const acting = e?.kind === EventKind.Move && e.actor === m.id
  const struck = mineEvent?.kind === EventKind.Hit || mineEvent?.kind === EventKind.Miss
  const down = m.hp === 0 || m.out
  const callout = move && move.actor === m.id && seq - move.seq < CALLOUT_EVENTS ? battleMove(move.moveId) : null
  const fxType = mineEvent?.kind === EventKind.Hit ? (mineEvent.status ? STATUS_INFO[mineEvent.status].type : mineEvent.type) : mineEvent?.kind === EventKind.Status && mineEvent.status ? STATUS_INFO[mineEvent.status].type : undefined
  const style = {
    left: `${spot.left}%`,
    bottom: `calc(var(--ground) + ${spot.rise}px)`,
    zIndex: spot.z,
    ['--spot-scale' as string]: spot.scale,
    ['--idle-delay' as string]: `${idleDelay}s`,
  } as CSSProperties
  const size = m.boss ? SIZE.boss : side === 'foe' ? SIZE.foe : mine ? SIZE.mine : SIZE.party
  const fallen = down ? (side === 'foe' ? 'fainted' : 'down') : ''

  return (
    <div className={`incursion-fighter ${side} ${fallen}`} style={style}>
      {callout && (
        <span key={move!.seq} className="move-callout" style={{ ['--type-color' as string]: TYPE_INFO[callout.type].color } as CSSProperties}>
          {callout.name}
        </span>
      )}
      {mineEvent && <StagePop e={mineEvent} seq={seq} />}
      {fxType && <HitEffect key={`fx-${seq}`} type={fxType} />}
      {mine && <span className="raid-mine-tag">Tú</span>}
      <div className={acting ? roundClass(seq, side === 'party' ? 'raid-lunge' : 'raid-boss-lunge') : ''}>
        <div className={struck ? roundClass(seq, 'raid-shake') : ''}>
          <div className={down ? '' : 'raid-idle'}>
            <div className={statusClass(down ? null : m.status)}>
              <div className="scene-shadow" />
              <Sprite id={m.speciesId} size={size} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

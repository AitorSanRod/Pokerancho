import type { CSSProperties } from 'react'
import { STATUS_INFO } from '../../data/passives'
import { EventKind } from '../../game/incursion/events'
import { HitEffect } from '../route/HitEffect'
import { statusClass } from '../route/battleFrame'
import { battleFit, BOSS_SPRITE_SIZE, ENEMY_SPRITE_SIZE } from '../route/spriteSizes'
import { roundClass } from '../raid/roundClass'
import { Sprite } from '../shared/common'
import type { SceneMon, SceneState } from './sceneState'
import { StagePop } from './StagePop'
import type { Spot } from './stageSpots'


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
 * Un Pokémon de la incursión como los del combate de ruta: encima, lo que le pasa (el golpe, una cura en verde, un
 * estado…); el efecto del golpe; embiste al atacar, tiembla al recibir, el estado alterado se ve
 * en el sprite y, al caer, el rival se va y el del grupo se queda tumbado
 */
export function StageFighter({ m, spot, side, mine, scene, idleDelay }: Props) {
  const { current: e, seq } = scene
  const mineEvent = e?.target === m.id ? e : null
  const acting = e?.kind === EventKind.Move && e.actor === m.id
  const struck = mineEvent?.kind === EventKind.Hit || mineEvent?.kind === EventKind.Miss
  const down = m.hp === 0 || m.out
  const fxType = mineEvent?.kind === EventKind.Hit ? (mineEvent.status ? STATUS_INFO[mineEvent.status].type : mineEvent.type) : mineEvent?.kind === EventKind.Status && mineEvent.status ? STATUS_INFO[mineEvent.status].type : undefined
  const style = {
    left: `${spot.left}%`,
    bottom: `calc(var(--ground) + ${spot.rise}px)`,
    zIndex: spot.z,
    ['--spot-scale' as string]: spot.scale,
    ['--idle-delay' as string]: `${idleDelay}s`,
  } as CSSProperties
  const size = m.boss ? BOSS_SPRITE_SIZE : ENEMY_SPRITE_SIZE
  const fallen = down ? (side === 'foe' ? 'fainted' : 'down') : ''

  return (
    <div className={`incursion-fighter ${side} ${fallen}`} style={style}>
      {mineEvent && <StagePop e={mineEvent} seq={seq} />}
      {fxType && <HitEffect key={`fx-${seq}`} type={fxType} />}
      {mine && <span className="raid-mine-tag">Tú</span>}
      <div className={acting ? roundClass(seq, side === 'party' ? 'raid-lunge' : 'raid-boss-lunge') : ''}>
        <div className={struck ? roundClass(seq, 'raid-shake') : ''}>
          <div className={down ? '' : 'raid-idle'}>
            <div className={statusClass(down ? null : (m.statuses.at(-1) ?? null))}>
              <div className="scene-shadow" />
              <Sprite id={m.speciesId} size={size} fit={battleFit(m.speciesId)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { INCURSIONS, IncursionTier, RoomKind, type Incursion } from '../../data/incursions'
import type { GameState } from '../../game/core/state'
import { foeLevels } from '../../game/incursion/entry'
import { freePrizeSpent } from '../../game/incursion/freeIncursions'
import { canAffordEntry, keysOf, needsKey } from '../../game/incursion/keys'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'
import { goToShop } from '../shared/navigation'
import { BIOME_SCENERY } from '../shared/sheet/scenery'
import { IncursionInfo } from './IncursionInfo'
import { IncursionPrep } from './IncursionPrep'
import { ScheduleDialog } from './ScheduleDialog'

const TIER_NAME: Record<IncursionTier, string> = { [IncursionTier.VeryEasy]: 'Muy fácil', [IncursionTier.Easy]: 'Fácil', [IncursionTier.Medium]: 'Media', [IncursionTier.Hard]: 'Difícil' }

interface Props {
  game: GameState
  /** Con servidor: las que piden llave se programan; sin él, todas se juegan ya con bots */
  online: boolean
  /** Hora del servidor */
  now: number
  onScheduled: () => void
}

/**
 * Subpestaña Programar: todas las incursiones con sus llaves; con servidor, «Programar» (con otros jugadores) en las
 * que piden llave y «Jugar ya» (con bots) en las gratuitas; sin servidor, todas «Jugar ya»
 */
export function IncursionList(props: Props) {
  const [info, setInfo] = useState(false)
  const [chosen, setChosen] = useState<Incursion | null>(null)
  const [scheduling, setScheduling] = useState<Incursion | null>(null)
  const { game, online } = props

  return (
    <>
      <button className="btn incursion-info-btn" onClick={() => setInfo(true)}>
        Cómo funcionan las incursiones
      </button>
      {!online && <p className="tiny muted center">Sin conexión con el servidor: se juega al momento con bots. Para jugar con otros, se programan con conexión.</p>}
      {INCURSIONS.map((inc) => (
        <IncursionCard key={inc.id} game={game} inc={inc} schedules={online && needsKey(inc.id)} onEnter={() => setChosen(inc)} onSchedule={() => setScheduling(inc)} />
      ))}
      {info && <IncursionInfo onClose={() => setInfo(false)} />}
      {chosen && <IncursionPrep game={game} inc={chosen} onClose={() => setChosen(null)} />}
      {scheduling && (
        <ScheduleDialog
          game={game}
          inc={scheduling}
          now={props.now}
          onClose={() => setScheduling(null)}
          onDone={() => {
            setScheduling(null)
            props.onScheduled()
          }}
        />
      )}
    </>
  )
}

interface CardProps {
  game: GameState
  inc: Incursion
  schedules: boolean
  onEnter: () => void
  onSchedule: () => void
}

function IncursionCard({ game, inc, schedules, onEnter, onSchedule }: CardProps) {
  const battles = inc.rooms.filter((r) => r.kind === RoomKind.Battle).length
  const keys = keysOf(game, inc.id)
  return (
    <article className="card incursion-card">
      <div className="incursion-card-art" style={{ backgroundImage: `url(${BIOME_SCENERY[inc.biome]})` }}>
        <h3>{inc.name}</h3>
        <span className="incursion-card-tier tiny">{TIER_NAME[inc.tier]}</span>
      </div>
      <div className="incursion-card-body">
        <p className="small">{inc.description}</p>
        <p className="tiny muted">
          Entran Nv. {inc.minLevel}–{inc.maxLevel} · Rivales Nv. {foeLevels(inc).join('–')} · {inc.rooms.length} salas, {battles} de combate
        </p>
        <div className="row gap incursion-card-actions">
          {needsKey(inc.id) ? (
            <span className="incursion-keys small">
              <ItemIcon item={ICON.Incursion} size={24} off={keys === 0} /> ×{keys}
            </span>
          ) : (
            <span className="incursion-keys small">{freePrizeSpent(game, inc.id) ? 'Gratis · premios ya cobrados' : 'Gratis'}</span>
          )}
          {schedules ? (
            <button className="btn go grow" onClick={onSchedule}>
              Programar
            </button>
          ) : !canAffordEntry(game, inc.id) ? (
            <button className="btn primary grow" onClick={() => goToShop('keys')}>
              Comprar llave
            </button>
          ) : (
            <button className="btn go grow" onClick={onEnter}>
              Jugar ya
            </button>
          )}
        </div>
      </div>
    </article>
  )
}

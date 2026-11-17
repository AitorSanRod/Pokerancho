import type { ReactNode } from 'react'
import { incursion } from '../../data/incursions'
import type { GameState } from '../../game/core/state'
import { keysOf } from '../../game/incursion/keys'
import { PARTY_SIZE } from '../../game/incursion/party'
import type { ScheduleView } from '../../game/incursion/schedule/scheduleView'
import { formatWhen } from '../shared/format'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'
import { BIOME_SCENERY } from '../shared/sheet/scenery'
import { IncursionPrizesFold } from './IncursionPrizes'

/** Una incursión programada: hora, huecos, nivel, llaves y premios; abajo, lo que se puede hacer con ella */
export function ScheduleCard({ game, view, children }: { game: GameState; view: ScheduleView; children?: ReactNode }) {
  const inc = incursion(view.incursionId)
  const keys = keysOf(game, inc.id)
  return (
    <article className="card incursion-card schedule-card">
      <div className="incursion-card-art" style={{ backgroundImage: `url(${BIOME_SCENERY[inc.biome]})` }}>
        <h3>{inc.name}</h3>
        <span className="incursion-card-tier tiny">{formatWhen(view.startAt)}</span>
      </div>
      <div className="incursion-card-body">
        <p className="tiny muted">
          Programada por {view.creator} · Entran Nv. {inc.minLevel}–{inc.maxLevel}
        </p>
        <p className="small">
          <strong>
            {view.seats.length}/{PARTY_SIZE}
          </strong>{' '}
          {view.seats.map((s) => s.nickname).join(', ')}
        </p>
        <div className="row gap schedule-card-key small">
          <ItemIcon item={ICON.Incursion} size={24} off={keys === 0} />
          {keys > 0 ? `Tienes ${keys} llave${keys === 1 ? '' : 's'}` : 'No tienes llave: sin ella no podrás entrar'}
        </div>
        <IncursionPrizesFold inc={inc} />
        {children}
      </div>
    </article>
  )
}

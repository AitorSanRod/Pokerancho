import { incursion } from '../../data/incursions'
import { PARTY_SIZE } from '../../game/incursion/party'
import type { ScheduleView } from '../../game/incursion/schedule/scheduleView'
import { useScheduleBoard } from '../../net/incursionBoard'
import { IncursionPrizesFold } from '../incursion/IncursionPrizes'
import { formatWhen } from '../shared/format'
import { goToIncursions } from '../shared/navigation'
import './board.css'

/**
 * Las incursiones programadas que aún no han empezado, como anuncios del tablón del menú: quién la programó, cuándo,
 * huecos, nivel y premios, con un botón para ir a apuntarse. Sin servidor no sale nada
 */
export function ScheduledAnnouncements() {
  const { board } = useScheduleBoard()
  const upcoming = board?.open ?? []
  if (upcoming.length === 0) return null
  return (
    <section className="board-scheduled">
      <div className="label">Incursiones programadas</div>
      {upcoming.map((v) => (
        <ScheduledAnnouncement key={v.id} view={v} />
      ))}
    </section>
  )
}

function ScheduledAnnouncement({ view }: { view: ScheduleView }) {
  const inc = incursion(view.incursionId)
  const mine = view.you !== null
  return (
    <article className="announcement">
      <span className="tiny muted">
        Programada por {view.creator} · empieza {formatWhen(view.startAt)}
      </span>
      <h3>{inc.name}</h3>
      <p className="small">
        {view.seats.length}/{PARTY_SIZE} apuntados ({view.seats.map((s) => s.nickname).join(', ')}) · Entran Nv. {inc.minLevel}–{inc.maxLevel}
        {mine && ' · Ya estás apuntado'}
      </p>
      <IncursionPrizesFold inc={inc} />
      <button className="btn go" onClick={() => goToIncursions(mine ? 'mine' : 'board')}>
        {mine ? 'Ver en Mis incursiones' : 'Ver en el tablón de incursiones'}
      </button>
    </article>
  )
}

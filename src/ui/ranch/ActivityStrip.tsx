import { ActivityKind, activities, type Activity } from '../../game/core/activity'
import type { GameState } from '../../game/core/state'
import { useScheduleBoardPeek } from '../../net/incursionBoard'
import { ItemIcon } from '../shared/ItemIcon'
import { activityCard } from './activityText'
import './activity-strip.css'

/**
 * Botones «En curso» abajo del rancho, entre la Caja y el Menú y con su mismo aspecto: solo incursiones y raids: lo que
 * tiene en marcha y lo abierto para unirse (sala de raid, tablón de incursiones). Cada uno
 * lleva a su pestaña; sin nada, no se pinta
 */
export function ActivityStrip({ game }: { game: GameState }) {
  const { board, clockOffset } = useScheduleBoardPeek()
  const now = game.lastTick + clockOffset
  const list = activities(game, now, board?.open ?? null)
  if (list.length === 0) return null

  return (
    <nav className="activity-strip" aria-label="En curso">
      {list.map((a) => {
        const card = activityCard(a, now)
        const text = `${card.title}: ${card.detail}`
        return (
          <button key={`${a.kind}:${card.title}`} className={`activity-button ${a.ready ? 'ready' : ''}`} onClick={card.go} title={text} aria-label={text}>
            <ItemIcon item={card.icon} size={34} />
            <span className="tiny">{card.label}</span>
            <ActivityMark activity={a} />
          </button>
        )
      })}
    </nav>
  )
}

/** Marca de la esquina: cuántas programadas hay o, en lo demás, si pide que se mire ya o sigue en marcha */
function ActivityMark({ activity }: { activity: Activity }) {
  if (activity.kind === ActivityKind.Scheduled) return <span className="count-badge">{activity.count}</span>
  return <span className={activity.ready ? 'dot' : 'live-dot'} />
}

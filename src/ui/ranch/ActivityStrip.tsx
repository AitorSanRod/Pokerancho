import { activities } from '../../game/core/activity'
import type { GameState } from '../../game/core/state'
import { useScheduleBoardPeek } from '../../net/incursionBoard'
import { ItemIcon } from '../shared/ItemIcon'
import { activityCard } from './activityText'
import './activity-strip.css'

/**
 * Tira «En curso» arriba del rancho: lo que tiene en marcha (ruta, torre, incursiones, raids, expediciones) y lo abierto
 * para unirse (sala de raid, tablón de incursiones). Cada tarjeta lleva a su pestaña; sin nada, no se pinta
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
        return (
          <button key={`${a.kind}:${card.title}`} className={`activity-card ${a.ready ? 'ready' : ''}`} onClick={card.go}>
            <span className="activity-icon">
              <ItemIcon item={card.icon} size={26} />
              <span className={a.ready ? 'dot' : 'live-dot'} />
            </span>
            <span className="activity-text">
              <strong className="small">{card.title}</strong>
              <span className="tiny">{card.detail}</span>
            </span>
          </button>
        )
      })}
    </nav>
  )
}

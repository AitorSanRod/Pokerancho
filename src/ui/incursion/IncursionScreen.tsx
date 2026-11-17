import type { GameState } from '../../game/core/state'
import { IncursionTabs } from './IncursionTabs'
import { IncursionView } from './IncursionView'
import { ScheduleRoom } from './ScheduleRoom'
import './incursion.css'
import './schedule.css'

/** Pestaña Ruta › Incursiones: la incursión en curso, la sala del checkin o, si no hay nada, el tablón y la lista */
export function IncursionScreen({ game }: { game: GameState }) {
  if (game.incursion) return <IncursionView game={game} a={game.incursion} />
  if (game.incursionCheckin) return <ScheduleRoom game={game} c={game.incursionCheckin} />
  return <IncursionTabs game={game} />
}

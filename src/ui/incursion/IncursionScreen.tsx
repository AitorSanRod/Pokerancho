import type { GameState } from '../../game/core/state'
import { IncursionTabs } from './IncursionTabs'
import { IncursionView } from './IncursionView'
import './incursion.css'
import './schedule.css'

/** Comunidad › Incursiones: la incursión en curso, a pantalla completa, o sus subpestañas (con la sala del checkin, si está abierta) */
export function IncursionScreen({ game }: { game: GameState }) {
  if (game.incursion) return <IncursionView game={game} a={game.incursion} />
  return <IncursionTabs game={game} />
}

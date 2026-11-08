import type { GameState } from '../../game/core/state'
import { IncursionList } from './IncursionList'
import { IncursionQueueView } from './IncursionQueueView'
import { IncursionView } from './IncursionView'
import './incursion.css'

/** Pestaña Ruta › Incursiones: la incursión en curso, la búsqueda de grupo o, si no hay nada, la lista para entrar en una */
export function IncursionScreen({ game }: { game: GameState }) {
  if (game.incursion) return <IncursionView game={game} a={game.incursion} />
  if (game.incursionQueue) return <IncursionQueueView game={game} q={game.incursionQueue} />
  return <IncursionList game={game} />
}

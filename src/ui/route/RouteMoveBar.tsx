import type { IncursionMove } from '../../data/incursionMoves'
import type { OwnedMon } from '../../game/core/state'
import { towerMoveChoices } from '../../game/tower/towerMoves'
import { MoveBarMoves } from '../incursion/MoveBarMoves'

/** En las rutas, la torre y la raid solo cuenta el golpe: tipo (en la etiqueta), potencia y precisión */
const strikeText = (mv: IncursionMove) => `Pot. ${mv.power} · Prec. ${mv.accuracy} %`

interface Props {
  mon: OwnedMon
  moveId: string
  /** El que usa ahora, si no es el elegido (en la raid, el cambio llega en el próximo turno); sin él, el elegido */
  inUseId?: string
  /** Los que puede elegir; sin ellos, los de daño de su repertorio (los de la torre) */
  moves?: IncursionMove[]
  /** En la página (antes de salir) en lugar de fija abajo sobre la escena */
  inline?: boolean
  onPick: (moveId: string) => void
}

/**
 * Barra de ataques de las rutas, la torre y la raid, la misma de las incursiones: un toque cambia el ataque, en pleno
 * combate desde su siguiente ataque
 */
export function RouteMoveBar({ mon, moveId, inUseId = moveId, moves = towerMoveChoices(mon), inline = false, onPick }: Props) {
  return (
    <div className={`move-bar ${inline ? 'inline' : ''}`}>
      <div className="move-bar-head">
        <strong>Tu ataque</strong>
        <span className="move-bar-hint">{inline ? 'También en pleno combate' : 'Cambia desde su siguiente ataque'}</span>
      </div>
      <MoveBarMoves moves={moves} selectedId={moveId} inUseId={inUseId} meta={strikeText} onPick={onPick} />
    </div>
  )
}

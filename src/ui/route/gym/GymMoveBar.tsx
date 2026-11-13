import type { IncursionMove } from '../../../data/incursionMoves'
import type { OwnedMon } from '../../../game/core/state'
import { towerMoveChoices } from '../../../game/tower/towerMoves'
import { MoveBarMoves } from '../../incursion/MoveBarMoves'

/** En el gimnasio, como en la torre, solo cuenta el golpe: tipo (en la etiqueta), potencia y precisión */
const strikeText = (mv: IncursionMove) => `Pot. ${mv.power} · Prec. ${mv.accuracy} %`

interface Props {
  mon: OwnedMon
  moveId: string
  /** En la página (antes de salir) en lugar de fija abajo sobre la escena */
  inline?: boolean
  onPick: (moveId: string) => void
}

/** Barra de ataques del gimnasio, la de la torre y las incursiones: un toque lo cambia desde el siguiente ataque */
export function GymMoveBar({ mon, moveId, inline = false, onPick }: Props) {
  return (
    <div className={`move-bar ${inline ? 'inline' : ''}`}>
      <div className="move-bar-head">
        <strong>Tu ataque</strong>
        <span className="move-bar-hint">{inline ? 'También en pleno combate' : 'Cambia desde su siguiente ataque'}</span>
      </div>
      <MoveBarMoves moves={towerMoveChoices(mon)} selectedId={moveId} inUseId={moveId} meta={strikeText} onPick={onPick} />
    </div>
  )
}

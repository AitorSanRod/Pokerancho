import type { IncursionMove } from '../../data/incursionMoves'
import type { OwnedMon } from '../../game/core/state'
import { towerMoveChoices } from '../../game/tower/towerMoves'
import { MoveBarMoves } from '../incursion/MoveBarMoves'

/** En la torre solo cuenta el golpe: tipo (en la etiqueta), potencia y precisión */
const strikeText = (mv: IncursionMove) => `Pot. ${mv.power} · Prec. ${mv.accuracy} %`

interface Props {
  mon: OwnedMon
  /** El ataque elegido para el siguiente piso */
  selectedId: string
  /** El del combate en curso; null entre pisos */
  inUseId: string | null
  hint: string
  /** En la página (antes de empezar) en lugar de fija abajo sobre la escena */
  inline?: boolean
  onPick: (moveId: string) => void
}

/** Barra de ataques de la torre, la misma de las incursiones: un toque cambia el ataque desde el siguiente piso */
export function TowerMoveBar({ mon, selectedId, inUseId, hint, inline = false, onPick }: Props) {
  const changed = inUseId !== null && inUseId !== selectedId
  return (
    <div className={`move-bar ${inline ? 'inline' : ''}`}>
      <div className="move-bar-head">
        <strong>Tu ataque</strong>
        <span className={changed ? 'move-bar-next' : 'move-bar-hint'}>{changed ? 'Cambia en el siguiente piso' : hint}</span>
      </div>
      <MoveBarMoves moves={towerMoveChoices(mon)} selectedId={selectedId} inUseId={inUseId} meta={strikeText} onPick={onPick} />
    </div>
  )
}

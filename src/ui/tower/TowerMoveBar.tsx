import type { IncursionMove } from '../../data/incursionMoves'
import type { OwnedMon } from '../../game/core/state'
import { towerMoveChoices } from '../../game/tower/towerMoves'
import { MoveBarMoves } from '../incursion/MoveBarMoves'

/** Alto (px) de la barra sin ataques (cabecera y márgenes) y de cada fila de ataques; se ven como mucho dos filas */
const BAR_BASE = 54
const BAR_ROW = 60
const MAX_ROWS = 2

/** Lo que ocupa abajo la barra de ese Pokémon: la escena de la subida acaba encima */
export const towerMoveBarRoom = (mon: OwnedMon): number =>
  BAR_BASE + BAR_ROW * Math.min(MAX_ROWS, Math.max(1, Math.ceil(towerMoveChoices(mon).length / 2)))

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

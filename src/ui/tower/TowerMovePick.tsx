import { useState } from 'react'
import type { IncursionMove } from '../../data/incursionMoves'
import type { OwnedMon } from '../../game/core/state'
import { towerMoveChoices } from '../../game/tower/towerMoves'
import { MovePicker } from '../incursion/MovePicker'

/** En la torre solo cuenta el golpe: tipo (en la cabecera), potencia y precisión */
const strikeText = (mv: IncursionMove) => `Potencia ${mv.power} · Precisión ${mv.accuracy} %`

interface Props {
  mon: OwnedMon
  /** El ataque marcado al abrirlo (el que llevaba, o el primero) */
  initialId: string | null
  title: string
  confirmLabel: string
  disabled?: boolean
  onConfirm: (moveId: string) => void
}

/** Elegir el ataque de la torre entre los de daño del Pokémon, al empezar o cada pocos pisos */
export function TowerMovePick({ mon, initialId, title, confirmLabel, disabled = false, onConfirm }: Props) {
  const choices = towerMoveChoices(mon)
  const [selected, setSelected] = useState(() => choices.find((mv) => mv.id === initialId)?.id ?? choices[0]?.id ?? '')
  return (
    <div className="card tower-pick">
      <strong className="small">{title}</strong>
      <MovePicker moves={choices} selectedId={selected} onSelect={setSelected} describe={strikeText} />
      <button className="btn primary wide" disabled={disabled || !selected} onClick={() => onConfirm(selected)}>
        {confirmLabel}
      </button>
    </div>
  )
}

import type { IncursionMove } from '../../data/incursionMoves'
import { TYPE_INFO } from '../../data/types'
import { moveClass } from '../../data/incursionMoves'
import { CLASS_LABEL, moveText } from '../shared/moveText'

/** Lista de movimientos para elegir uno: nombre, tipo, papel y lo que hace */
export function MovePicker({ moves, selectedId, onSelect }: { moves: IncursionMove[]; selectedId: string; onSelect: (id: string) => void }) {
  return (
    <div className="incursion-moves" role="listbox">
      {moves.map((mv) => (
        <button
          key={mv.id}
          role="option"
          aria-selected={mv.id === selectedId}
          className={`incursion-move ${mv.id === selectedId ? 'selected' : ''}`}
          style={{ ['--type-color' as string]: TYPE_INFO[mv.type].color }}
          onClick={() => onSelect(mv.id)}
        >
          <span className="incursion-move-head">
            <strong>{mv.name}</strong>
            <span className="incursion-move-kind tiny">
              {CLASS_LABEL[moveClass(mv)]} · {TYPE_INFO[mv.type].name}
            </span>
          </span>
          <span className="tiny muted">{moveText(mv)}</span>
        </button>
      ))}
    </div>
  )
}

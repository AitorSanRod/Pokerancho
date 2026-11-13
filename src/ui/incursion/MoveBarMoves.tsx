import type { IncursionMove } from '../../data/incursionMoves'
import { TYPE_INFO } from '../../data/types'
import './move-bar.css'

interface Props {
  moves: IncursionMove[]
  /** El elegido (para el próximo turno o piso) */
  selectedId: string
  /** El que se está usando ahora; si es otro que el elegido, sale con el borde discontinuo */
  inUseId: string | null
  /** Línea de debajo del nombre (potencia, precisión…) */
  meta: (mv: IncursionMove) => string
  onPick: (moveId: string) => void
}

/** Los ataques de la barra, como el menú de combate de los juegos: dos por fila, cada uno con el color de su tipo */
export function MoveBarMoves({ moves, selectedId, inUseId, meta, onPick }: Props) {
  return (
    <div className="move-bar-moves">
      {moves.map((mv) => (
        <button
          key={mv.id}
          className={`move-bar-move ${mv.id === selectedId ? 'selected' : ''} ${mv.id === inUseId ? 'in-use' : ''}`}
          style={{ ['--type-color' as string]: TYPE_INFO[mv.type].color }}
          onClick={() => onPick(mv.id)}
        >
          <span className="move-bar-type">{TYPE_INFO[mv.type].name}</span>
          <strong className="move-bar-name">{mv.name}</strong>
          <span className="move-bar-meta">{meta(mv)}</span>
        </button>
      ))}
    </div>
  )
}

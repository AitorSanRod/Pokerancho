import type { IncursionMove } from '../../data/incursionMoves'
import { TYPE_INFO } from '../../data/types'
import './move-bar.css'

interface Props {
  moves: IncursionMove[]
  /** El elegido (para el próximo turno o piso); sin él, ninguno */
  selectedId?: string | null
  /** El que se está usando ahora; si es otro que el elegido, sale con el borde discontinuo */
  inUseId?: string | null
  /** Línea de debajo del nombre (potencia, precisión…) */
  meta: (mv: IncursionMove) => string
  /** Los que salen pero no se pueden tocar */
  disabledOf?: (mv: IncursionMove) => boolean
  /** Huecos libres detrás de los ataques (en la ficha); al tocarlos, onEmpty con su posición */
  emptySlots?: number
  onEmpty?: (slot: number) => void
  onPick: (moveId: string) => void
}

/** Los ataques de la barra, como el menú de combate de los juegos: dos por fila, cada uno con el color de su tipo */
export function MoveBarMoves({ moves, selectedId = null, inUseId = null, meta, disabledOf, emptySlots = 0, onEmpty, onPick }: Props) {
  return (
    <div className="move-bar-moves">
      {moves.map((mv) => (
        <button
          key={mv.id}
          className={`move-bar-move ${mv.id === selectedId ? 'selected' : ''} ${mv.id === inUseId ? 'in-use' : ''}`}
          style={{ ['--type-color' as string]: TYPE_INFO[mv.type].color }}
          disabled={disabledOf?.(mv)}
          onClick={() => onPick(mv.id)}
        >
          <span className="move-bar-type">{TYPE_INFO[mv.type].name}</span>
          <strong className="move-bar-name">{mv.name}</strong>
          <span className="move-bar-meta">{meta(mv)}</span>
        </button>
      ))}
      {Array.from({ length: emptySlots }, (_, i) => (
        <button key={`empty-${i}`} className="move-bar-move empty" disabled={!onEmpty} onClick={() => onEmpty?.(moves.length + i)}>
          <strong className="move-bar-name">Hueco libre</strong>
          <span className="move-bar-meta">Toca para elegir</span>
        </button>
      ))}
    </div>
  )
}

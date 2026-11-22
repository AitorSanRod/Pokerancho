import { moveClass, type IncursionMove } from '../../../data/incursionMoves'
import { TYPE_INFO } from '../../../data/types'
import { TypeBadge } from '../common'
import { CLASS_LABEL, moveText } from '../moveText'

interface Props {
  move: IncursionMove
  /** «Desde Nv. 12», «Con MT»… */
  origin: string
  /** En las rutas no cuentan los toques de las incursiones */
  taps: boolean
}

const priorityText = (p: number) => (p === 0 ? 'Normal' : `${p > 0 ? '+' : '−'}${Math.abs(p)}`)

/** Todos los datos de un ataque: tipo, clase, potencia, precisión, prioridad, lo que hace y de dónde lo sabe */
export function MoveDetail({ move, origin, taps }: Props) {
  return (
    <div className="move-detail" style={{ ['--type-color' as string]: TYPE_INFO[move.type].color }}>
      <div className="move-detail-head">
        <strong>{move.name}</strong>
        <TypeBadge type={move.type} />
        <span className="moves-info-class">{CLASS_LABEL[moveClass(move)]}</span>
      </div>
      <dl className="move-detail-stats">
        <div>
          <dt>Potencia</dt>
          <dd>{move.power || '—'}</dd>
        </div>
        <div>
          <dt>Precisión</dt>
          <dd>{move.accuracy}%</dd>
        </div>
        <div>
          <dt>Prioridad</dt>
          <dd>{priorityText(move.priority)}</dd>
        </div>
      </dl>
      <p className="small">{moveText(move, { taps })}</p>
      <p className="tiny muted">{origin}</p>
    </div>
  )
}

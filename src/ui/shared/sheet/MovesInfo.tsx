import { createPortal } from 'react-dom'
import { moveClass } from '../../../data/incursionMoves'
import { signatureMove } from '../../../data/moves'
import { TYPE_INFO } from '../../../data/types'
import { learnTimeline, type LearnStep } from '../../../game/incursion/repertoire'
import { MoveChip } from '../common'
import { CLASS_LABEL, moveText } from '../moveText'
import '../overlays.css'
import './moves-info.css'

interface Props {
  speciesId: number
  /** Nivel del Pokémon, si lo tienes: marca lo que ya lleva */
  level: number | null
  onClose: () => void
}

/**
 * Todos los ataques de una especie y para qué sirve cada uno: el de rutas y jefes comunitarios (siempre el mismo) y el
 * repertorio de las incursiones, nivel a nivel
 */
export function MovesInfo({ speciesId, level, onClose }: Props) {
  const signature = signatureMove(speciesId)
  return createPortal(
    <div className="confirm-overlay" onClick={onClose}>
      <div className="card moves-info" role="dialog" aria-modal="true" aria-label="Sus ataques" onClick={(e) => e.stopPropagation()}>
        <h3>Sus ataques</h3>
        <div className="moves-info-body">
          <section>
            <h4>Rutas y jefes comunitarios</h4>
            <p className="small">Lo usa solo en cada combate de ruta y contra los jefes comunitarios. Es el de su primer tipo y su rareza, y no cambia con el nivel.</p>
            <MoveChip id={signature.id} />
          </section>
          <section>
            <h4>Incursiones</h4>
            <p className="small">Antes de entrar eliges uno de estos, y en plena pelea puedes cambiarlo. Los de daño golpean, los de cura dan PS al grupo y los de estado ponen estados alterados o suben y bajan etapas de stats. Los que tienen prioridad actúan antes en el turno. Al subir de nivel, el de daño de cada tipo mejora.</p>
            <ul className="moves-info-list">
              {learnTimeline(speciesId).map((step) => (
                <LearnRow key={step.move.id} step={step} level={level} />
              ))}
            </ul>
          </section>
        </div>
        <button className="btn primary" onClick={onClose}>
          Entendido
        </button>
      </div>
    </div>,
    document.body,
  )
}

function LearnRow({ step, level }: { step: LearnStep; level: number | null }) {
  const { move, from, until } = step
  const held = level !== null && from <= level && (until === null || until >= level)
  const when = until === null ? `Desde Nv. ${from}` : `Nv. ${from}–${until}`
  return (
    <li className={`moves-info-row ${held ? 'held' : ''}`} style={{ ['--type-color' as string]: TYPE_INFO[move.type].color }}>
      <span className="moves-info-head">
        <strong>{move.name}</strong>
        <span className="moves-info-class">{CLASS_LABEL[moveClass(move)]}</span>
        <span className="tiny muted">{when}</span>
        {held && <span className="tag ok">Lo lleva</span>}
      </span>
      <span className="tiny">{moveText(move)}</span>
    </li>
  )
}

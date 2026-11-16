import { incursionMove, moveClass, type IncursionMove } from '../../../data/incursionMoves'
import type { Tm } from '../../../data/tms'
import { TYPE_INFO } from '../../../data/types'
import { combatLearnTimeline, ROUTE_MOVE_SLOTS, routeMoveChoices } from '../../../game/combat/combatRepertoire'
import { MAX_LEVEL } from '../../../game/team/stats'
import { learnTimeline, type LearnStep } from '../../../game/incursion/repertoire'
import { CLASS_LABEL, moveText } from '../moveText'
import { Modal } from '../Modal'
import './moves-info.css'

interface Props {
  speciesId: number
  /** Nivel del Pokémon, si lo tienes: marca lo que ya lleva (en combate, solo salen los que lleva; sin él, los de nivel máximo) */
  level: number | null
  /** Lo que ha aprendido con MTs, si lo tienes */
  tmMoves?: Tm[]
  onClose: () => void
}

/**
 * Los ataques de una especie y para qué sirve cada uno: los que lleva en combate (rutas, torre y raids) y el repertorio
 * de las incursiones, nivel a nivel, más lo aprendido con MTs
 */
export function MovesInfo({ speciesId, level, tmMoves = [], onClose }: Props) {
  const carried = routeMoveChoices({ speciesId, level: level ?? MAX_LEVEL, tmMoves })
  const learnedAt = (id: string) => combatLearnTimeline(speciesId).find((step) => step.move.id === id)?.from
  return (
    <Modal className="moves-info" label="Sus ataques" onClose={onClose}>
      <h3>Sus ataques</h3>
      <div className="moves-info-body">
        <section>
          <h4>Rutas, torre y raids</h4>
          <p className="small">{level === null ? 'A nivel máximo lleva estos.' : 'Lleva estos.'} Antes de salir eliges uno, y puedes cambiarlo cuando quieras. Lleva {ROUTE_MOVE_SLOTS}: los más potentes que sabe (con dos tipos, el más potente de cada uno); al subir de nivel aprende otros más fuertes, y los más fuertes piden más rareza. Sus efectos son los mismos que en las incursiones.</p>
          <ul className="moves-info-list">
            {carried.map((move) => {
              const from = learnedAt(move.id)
              return <MoveRow key={move.id} move={move} when={from === undefined ? 'Con MT' : `Desde Nv. ${from}`} held={level !== null} />
            })}
          </ul>
        </section>
        <section>
          <h4>Incursiones</h4>
          <p className="small">Antes de entrar eliges uno de estos, y en plena pelea puedes cambiarlo. Los de daño golpean, los de cura dan PS al grupo y los de estado ponen estados alterados o suben y bajan etapas de stats. Los que tienen prioridad actúan antes en el turno. Al subir de nivel, el de daño de cada tipo mejora.</p>
          <ul className="moves-info-list">
            {learnTimeline(speciesId).map((step) => (
              <LearnRow key={step.move.id} step={step} level={level} />
            ))}
            {tmMoves.map((id) => (
              <MoveRow key={id} move={incursionMove(id)} when="Con MT" held />
            ))}
          </ul>
        </section>
      </div>
      <button className="btn primary" onClick={onClose}>
        Entendido
      </button>
    </Modal>
  )
}

function LearnRow({ step, level }: { step: LearnStep; level: number | null }) {
  const { move, from, until } = step
  const held = level !== null && from <= level && (until === null || until >= level)
  return <MoveRow move={move} when={until === null ? `Desde Nv. ${from}` : `Nv. ${from}–${until}`} held={held} />
}

function MoveRow({ move, when, held }: { move: IncursionMove; when: string; held: boolean }) {
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

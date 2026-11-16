import { combatMove } from '../../../data/combatMoves'
import { incursionMove, moveClass, MoveClass, type IncursionMove } from '../../../data/incursionMoves'
import type { Tm } from '../../../data/tms'
import { TYPE_INFO } from '../../../data/types'
import { combatLearnTimeline, ROUTE_MOVE_SLOTS, routeMoveChoices } from '../../../game/combat/combatRepertoire'
import { learnTimeline, type LearnStep } from '../../../game/incursion/repertoire'
import { CLASS_LABEL, moveText } from '../moveText'
import { Modal } from '../Modal'
import './moves-info.css'

interface Props {
  speciesId: number
  /** Nivel del Pokémon, si lo tienes: marca lo que ya lleva (en combate, los que caben en rutas y torre) */
  level: number | null
  /** Lo que ha aprendido con MTs, si lo tienes */
  tmMoves?: Tm[]
  onClose: () => void
}

/**
 * Todos los ataques de una especie y para qué sirve cada uno: los de combate (rutas, torre y raids) y el repertorio de
 * las incursiones, nivel a nivel, más lo aprendido con MTs
 */
export function MovesInfo({ speciesId, level, tmMoves = [], onClose }: Props) {
  const strikeTms = tmMoves.filter((id) => moveClass(combatMove(id)) === MoveClass.Damage)
  const carried = level === null ? [] : routeMoveChoices({ speciesId, level, tmMoves }).map((mv) => mv.id)
  return (
    <Modal className="moves-info" label="Sus ataques" onClose={onClose}>
      <h3>Sus ataques</h3>
      <div className="moves-info-body">
        <section>
          <h4>Rutas, torre y raids</h4>
          <p className="small">Antes de salir eliges uno de estos, y puedes cambiarlo cuando quieras. Al subir de nivel aprende otros más fuertes; los más fuertes piden más rareza. En rutas y torre lleva solo {ROUTE_MOVE_SLOTS}: primero los propios de su especie, luego los de MT y luego los últimos que aprendió; contra los jefes de Raids, cualquiera de los que sabe. Sus efectos son los mismos que en las incursiones.</p>
          <ul className="moves-info-list">
            {combatLearnTimeline(speciesId).map((step) => (
              <MoveRow key={step.move.id} move={step.move} when={`Desde Nv. ${step.from}`} held={carried.includes(step.move.id)} />
            ))}
            {strikeTms.map((id) => (
              <MoveRow key={id} move={combatMove(id)} when="Con MT" held={carried.includes(id)} />
            ))}
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

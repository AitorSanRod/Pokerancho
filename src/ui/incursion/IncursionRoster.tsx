import { STATUS_INFO } from '../../data/passives'
import { incursionMove } from '../../data/incursionMoves'
import { isBot } from '../../game/incursion/party'
import { Bar, Sprite } from '../shared/common'
import type { SceneMon } from './sceneState'

/** Los del grupo y los rivales de la sala, cada uno en una línea con sus PS (y, los del grupo, su movimiento) */
interface Props {
  party: SceneMon[]
  foes: SceneMon[]
  moveOf: (id: string) => string
  uid: string
  /** Apodos de los demás jugadores, por su Pokémon */
  nicknames: Record<string, string>
}

export function IncursionRoster({ party, foes, moveOf, uid, nicknames }: Props) {
  return (
    <div className="incursion-roster">
      <div className="incursion-roster-col">
        {party.map((m) => (
          <RosterLine key={m.id} m={m} note={m.id === uid ? 'Tú' : isBot(m.id) ? 'Bot' : (nicknames[m.id] ?? '')} move={incursionMove(moveOf(m.id)).name} />
        ))}
      </div>
      {foes.length > 0 && (
        <div className="incursion-roster-col foes">
          {foes.map((m) => (
            <RosterLine key={m.id} m={m} note={m.boss ? 'Jefe' : ''} />
          ))}
        </div>
      )}
    </div>
  )
}

function RosterLine({ m, note, move }: { m: SceneMon; note: string; move?: string }) {
  const gone = m.out || m.hp === 0
  return (
    <div className={`incursion-line ${gone ? 'gone' : ''}`}>
      <Sprite id={m.speciesId} size={32} animated={false} />
      <div className="incursion-line-main">
        <span className="incursion-line-name tiny">
          <strong>{m.name}</strong> Nv. {m.level}
          {note && <em> · {note}</em>}
          {m.status && <span className="incursion-status"> {STATUS_INFO[m.status].short}</span>}
          {m.out && <span className="incursion-status"> FUERA</span>}
        </span>
        <Bar value={m.hp} max={m.maxHp} kind="hp" />
        {move && <span className="tiny muted">{move}</span>}
      </div>
    </div>
  )
}

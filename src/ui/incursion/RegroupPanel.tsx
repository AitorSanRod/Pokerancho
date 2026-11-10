import { incursionMove, moveClass } from '../../data/incursionMoves'
import { species } from '../../data/species'
import { findMon, type GameState } from '../../game/core/state'
import { act } from '../../game/core/store'
import type { ActiveIncursion } from '../../game/incursion/activeIncursion'
import { chooseIncursionMove, continueIncursion } from '../../game/incursion/incursionGame'
import type { MemberState } from '../../game/incursion/fighter'
import { monRepertoire } from '../../game/incursion/repertoire'
import { sendIncursionMove, sendIncursionReady } from '../../net/incursionSync'
import { MovePicker } from './MovePicker'
import { CLASS_LABEL } from '../shared/moveText'

/**
 * Sala de reorganizar: lo que lleva cada uno (y lo que van eligiendo los demás) y, para el tuyo, elegir otro movimiento
 * antes de que acabe el plazo. Con otros jugadores, el tramo sigue cuando todos dan a seguir o se acaba el plazo
 */
export function RegroupPanel({ game, a, members, msLeft }: { game: GameState; a: ActiveIncursion; members: MemberState[]; msLeft: number }) {
  const mon = findMon(game, a.uid)
  const mine = members.find((m) => m.id === a.uid)
  if (!mon || !mine) return null
  const selected = a.nextMove ?? mine.moveId
  const online = a.online
  const players = online ? Object.keys(online.nicknames).length : 1
  const imReady = !!online?.ready.includes(a.uid)
  const moveOf = (m: MemberState) => (m.id === a.uid ? selected : (online?.nextMoves[m.id] ?? m.moveId))

  const choose = (id: string) => {
    act((s) => chooseIncursionMove(s, id, Date.now()))
    if (online) void sendIncursionMove(id)
  }
  const goOn = () => (online ? void sendIncursionReady() : act((s) => continueIncursion(s, Date.now())))

  return (
    <section className="card incursion-regroup">
      <div className="row incursion-regroup-head">
        <h3>Reorganizar</h3>
        <span className="incursion-countdown">{msLeft > 0 ? `${Math.ceil(msLeft / 1000)} s` : '…'}</span>
      </div>
      <ul className="incursion-regroup-team tiny">
        {members.map((m) => {
          const mv = incursionMove(moveOf(m))
          const who = m.id === a.uid ? '(tú)' : (online?.nicknames[m.id] ?? '')
          return (
            <li key={m.id}>
              <strong>{species(m.speciesId).name}</strong> {who} · {mv.name} <span className="muted">({CLASS_LABEL[moveClass(mv)]})</span>
              {online?.ready.includes(m.id) && <em className="incursion-ready"> listo</em>}
            </li>
          )
        })}
      </ul>
      <div className="label">Tu movimiento para lo que queda</div>
      <MovePicker moves={monRepertoire(mon)} selectedId={selected} onSelect={choose} />
      <button className="btn primary" disabled={imReady} onClick={goOn}>
        {imReady ? `Esperando a los demás (${online?.ready.length ?? 0}/${players})` : 'Seguir ya'}
      </button>
    </section>
  )
}

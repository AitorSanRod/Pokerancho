import { incursion } from '../../data/incursions'
import { findMon, type GameState } from '../../game/core/state'
import type { IncursionQueue } from '../../game/incursion/online/linkedIncursion'
import { QUEUE_MAX_MS } from '../../game/incursion/online/protocol'
import { PARTY_SIZE } from '../../game/incursion/party'
import { leaveIncursionQueue, useIncursionQueue } from '../../net/incursionSync'
import { Sprite } from '../shared/common'

/** Buscando grupo: cuántos esperan, cuánto llevas y cancelar (la llave aún no se ha gastado) */
export function IncursionQueueView({ game, q }: { game: GameState; q: IncursionQueue }) {
  const server = useIncursionQueue()
  const mon = findMon(game, q.uid)
  const waitedS = Math.max(0, Math.floor((game.lastTick - q.since) / 1000))
  const botsInS = Math.max(0, Math.ceil(QUEUE_MAX_MS / 1000) - waitedS)

  return (
    <div className="screen scroll incursion-view">
      <section className="card incursion-queue">
        <h3>{incursion(q.incursionId).name}</h3>
        {mon && <Sprite id={mon.speciesId} size={96} className="idle-bounce" shiny={mon.shiny} />}
        <p className="incursion-queue-count">
          Buscando grupo… {server ? `${server.waiting}/${PARTY_SIZE}` : ''}
        </p>
        <p className="small muted">
          {waitedS} s esperando.{' '}
          {botsInS > 0 ? `Si en ${botsInS} s no sois ${PARTY_SIZE}, el grupo se completa con bots.` : 'Completando el grupo con bots…'}
        </p>
        <p className="tiny muted">La llave se gasta cuando se forma el grupo. Si cancelas ahora, no la pierdes.</p>
        <button className="btn" onClick={() => void leaveIncursionQueue()}>
          Cancelar
        </button>
      </section>
    </div>
  )
}

import { useState } from 'react'
import { act } from '../../game/core/store'
import type { ActiveIncursion } from '../../game/incursion/activeIncursion'
import { retreatIncursion } from '../../game/incursion/incursionGame'
import { votesNeeded } from '../../game/incursion/retreatVote'
import { sendIncursionVote } from '../../net/incursionSync'
import { ConfirmDialog } from '../shared/ConfirmDialog'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'

/** Votar retirarse (o quitar el voto). Sin servidor basta tu voto; con otros jugadores, la mitad de ellos */
export function RetreatVote({ a }: { a: ActiveIncursion }) {
  const [confirming, setConfirming] = useState(false)
  const online = a.online
  const voted = !!online?.votes.includes(a.uid)
  const players = online ? Object.keys(online.nicknames).length : 1

  const vote = () => {
    if (online) void sendIncursionVote(true)
    else act((s) => retreatIncursion(s, Date.now()))
    setConfirming(false)
  }

  return (
    <>
      <button className="btn incursion-retreat" onClick={() => (voted ? void sendIncursionVote(false) : setConfirming(true))}>
        <ItemIcon item={ICON.Retreat} size={24} /> {voted ? 'Quitar mi voto' : 'Votar retirada'}
        {online && (
          <span className="tiny muted">
            {' '}
            ({online.votes.length}/{votesNeeded(players)})
          </span>
        )}
      </button>
      {confirming && (
        <ConfirmDialog title="¿Retirarse?" confirmLabel={online ? 'Votar' : 'Retirarse'} onCancel={() => setConfirming(false)} onConfirm={vote}>
          <p className="small">
            {online ? `Hacen falta ${votesNeeded(players)} votos de ${players} jugadores. ` : ''}
            La incursión acaba en ese momento: os lleváis lo ganado en las salas superadas, sin el premio final.
          </p>
        </ConfirmDialog>
      )}
    </>
  )
}

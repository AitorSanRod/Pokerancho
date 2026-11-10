import { useState } from 'react'
import { species } from '../../../data/species'
import { tmName, TMS, type Tm } from '../../../data/tms'
import type { GameState, OwnedMon } from '../../../game/core/state'
import { act } from '../../../game/core/store'
import { teachableTms, teachTm, tmsOf } from '../../../game/incursion/tms'
import { ConfirmDialog } from '../ConfirmDialog'
import { ItemIcon } from '../ItemIcon'
import { moveText } from '../moveText'
import { MonSection } from './MonSheet'

/** Enseñar MTs: una fila por cada MT que tiene el jugador y que este Pokémon puede aprender. Sin ninguna, no se pinta */
export function TmPanel({ game, mon }: { game: GameState; mon: OwnedMon }) {
  const [pending, setPending] = useState<Tm | null>(null)
  const tms = teachableTms(game, mon)
  if (tms.length === 0 && !pending) return null
  const teach = (tm: Tm) => {
    act((s) => teachTm(s, mon.uid, tm))
    setPending(null)
  }
  return (
    <MonSection title="MT">
      <div className="evolve-options">
        {tms.map((tm) => (
          <button key={tm} className="btn big-action" onClick={() => setPending(tm)}>
            <ItemIcon item={TMS[tm].item} size={40} />
            <span className="grow">
              {tmName(tm)} <span className="tiny muted">×{tmsOf(game, tm)}</span>
              <span className="tiny muted evolve-requirement">{moveText(TMS[tm].move)}</span>
            </span>
            <span className="tag">Enseñar</span>
          </button>
        ))}
      </div>
      {pending && (
        <ConfirmDialog title={`¿Enseñar ${TMS[pending].move.name}?`} confirmLabel="Enseñar" onConfirm={() => teach(pending)} onCancel={() => setPending(null)}>
          <p className="small">
            {species(mon.speciesId).name} lo sabrá para siempre y podrá llevarlo a las incursiones. Se gasta la {tmName(pending)}.
          </p>
        </ConfirmDialog>
      )}
    </MonSection>
  )
}

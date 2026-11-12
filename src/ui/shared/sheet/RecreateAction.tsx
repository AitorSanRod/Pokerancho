import { useState } from 'react'
import { species } from '../../../data/species'
import { STAR_ITEMS } from '../../../data/starItems'
import { PIECES_PER_COMBINE, type CombineResult } from '../../../game/collection/pieces'
import { recreate, recreateBlocker, recreatePrice } from '../../../game/collection/recreate'
import { starItemFor } from '../../../game/collection/starItems'
import type { GameState } from '../../../game/core/state'
import { act } from '../../../game/core/store'
import { NEW_MON_LEVEL } from '../../../game/team/mons'
import { ConfirmDialog } from '../ConfirmDialog'
import { ICON } from '../icons'
import { BigAction } from './MonSheet'

/** Volver a crear un Pokémon que ya tienes (borra el actual y sale uno nuevo), con confirmación */
export function RecreateAction({ game, speciesId, onCombined }: { game: GameState; speciesId: number; onCombined: (result: CombineResult | null) => void }) {
  const [confirming, setConfirming] = useState(false)
  const blocker = recreateBlocker(game, speciesId)
  const item = starItemFor(speciesId)
  const name = species(speciesId).name

  return (
    <>
      <BigAction icon={ICON.Piece} label="Volver a crear" price={recreatePrice(speciesId)} disabled={!!blocker} onClick={() => setConfirming(true)} />
      {blocker && <p className="tiny muted center">{blocker}</p>}
      {confirming && (
        <ConfirmDialog
          title="¿Seguro que quieres hacerlo?"
          confirmLabel="Volver a crear"
          onConfirm={() => {
            setConfirming(false)
            onCombined(act((s) => recreate(s, speciesId)))
          }}
          onCancel={() => setConfirming(false)}
        >
          <p className="small">
            Esto borrará a tu {name} actual y creará uno nuevo al Nv. {NEW_MON_LEVEL} sin mejoras: sin ★ ni MT, con
            naturaleza nueva y otra oportunidad de salir shiny.
          </p>
          <p className="tiny muted">
            Gasta {PIECES_PER_COMBINE} tickets{item ? ` y un ${STAR_ITEMS[item].name}` : ''}.
          </p>
        </ConfirmDialog>
      )}
    </>
  )
}

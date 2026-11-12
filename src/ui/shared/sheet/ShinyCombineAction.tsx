import { useState } from 'react'
import { species } from '../../../data/species'
import {
  combinePrice,
  combineShiny,
  piecesOf,
  SHINY_CHANCE,
  SHINY_COMBINE_PIECES,
  shinyCombineBlocker,
  type CombineResult,
} from '../../../game/collection/pieces'
import type { GameState } from '../../../game/core/state'
import { act } from '../../../game/core/store'
import { ConfirmDialog } from '../ConfirmDialog'
import { ICON } from '../icons'
import { BigAction } from './MonSheet'

/** Crear el Pokémon shiny seguro gastando muchos tickets (solo mientras aún no lo tienes), con confirmación */
export function ShinyCombineAction({ game, speciesId, onCombined }: { game: GameState; speciesId: number; onCombined: (result: CombineResult | null) => void }) {
  const [confirming, setConfirming] = useState(false)
  const blocker = shinyCombineBlocker(game, speciesId)
  const pieces = piecesOf(game, speciesId)
  const price = combinePrice(game, speciesId)

  return (
    <>
      <BigAction
        icon={ICON.Shiny}
        label={`Crear shiny (${Math.min(pieces, SHINY_COMBINE_PIECES)}/${SHINY_COMBINE_PIECES} tickets)`}
        price={price > 0 ? price : undefined}
        disabled={!!blocker}
        onClick={() => setConfirming(true)}
      />
      <p className="tiny muted center">Al crearlo hay un {Math.round(SHINY_CHANCE * 100)} % de que salga shiny; con {SHINY_COMBINE_PIECES} tickets sale seguro.</p>
      {confirming && (
        <ConfirmDialog
          title="¿Crear shiny?"
          confirmLabel="Crear shiny"
          onConfirm={() => {
            setConfirming(false)
            onCombined(act((s) => combineShiny(s, speciesId)))
          }}
          onCancel={() => setConfirming(false)}
        >
          <p className="small">
            Gastarás {SHINY_COMBINE_PIECES} tickets de {species(speciesId).name} para crearlo shiny seguro.
          </p>
        </ConfirmDialog>
      )}
    </>
  )
}

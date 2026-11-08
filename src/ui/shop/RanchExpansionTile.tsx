import { useState } from 'react'
import type { GameState } from '../../game/core/state'
import { act } from '../../game/core/store'
import {
  buyRanchExpansion,
  canExpand,
  expandableRanches,
  expansionsOf,
  RANCH_EXPANSION_MAX,
  RANCH_EXPANSION_PRICE,
  RANCH_EXPANSION_SLOTS,
} from '../../game/team/ranchExpansion'
import { ranchName } from '../../game/team/ranchNames'
import { ranchCapacity, ranchCount, usedSlots } from '../../game/team/ranches'
import { ConfirmDialog } from '../shared/ConfirmDialog'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'
import { ShopTile } from './ShopTile'

const PRICE_TEXT = `₽ ${RANCH_EXPANSION_PRICE.toLocaleString('es-ES')}`

/** Ampliación de rancho: al comprarla se elige qué rancho gana los espacios, hasta `RANCH_EXPANSION_MAX` por rancho */
export function RanchExpansionTile({ game }: { game: GameState }) {
  const [choosing, setChoosing] = useState(false)
  const expandable = expandableRanches(game)
  const blocker = game.money < RANCH_EXPANSION_PRICE ? `Necesitas ${PRICE_TEXT}.` : null

  return (
    <ShopTile
      icon={<ItemIcon item={ICON.Ranch} size={48} />}
      name="Ampliación de rancho"
      action={
        expandable.length === 0 ? (
          <span className="tag ok">Completo</span>
        ) : (
          <button className="btn primary small" disabled={!!blocker} title={blocker ?? undefined} onClick={() => setChoosing(true)}>
            {PRICE_TEXT}
          </button>
        )
      }
    >
      <span className="tiny muted">
        +{RANCH_EXPANSION_SLOTS} espacios en el rancho que elijas; como mucho {RANCH_EXPANSION_MAX} por rancho
      </span>
      {choosing && <ChooseRanchDialog game={game} onClose={() => setChoosing(false)} />}
    </ShopTile>
  )
}

function ChooseRanchDialog({ game, onClose }: { game: GameState; onClose: () => void }) {
  const [ranch, setRanch] = useState<number | null>(null)
  const buy = () => {
    if (ranch !== null) act((s) => buyRanchExpansion(s, ranch))
    onClose()
  }

  return (
    <ConfirmDialog title="¿Qué rancho amplías?" confirmLabel={`Ampliar por ${PRICE_TEXT}`} confirmDisabled={ranch === null} onConfirm={buy} onCancel={onClose}>
      <p className="small confirm-text">El rancho que elijas tendrá {RANCH_EXPANSION_SLOTS} espacios más para siempre.</p>
      <div className="expansion-options">
        {Array.from({ length: ranchCount(game) }, (_, i) => (
          <button
            key={i}
            className={`btn ${i === ranch ? 'primary' : ''}`}
            aria-pressed={i === ranch}
            disabled={!canExpand(game, i)}
            onClick={() => setRanch(i)}
          >
            <span className="with-icon grow">
              <ItemIcon item={ICON.Ranch} size={22} /> {ranchName(game, i)}
            </span>
            <span className="tiny">
              {usedSlots(game, i)}/{ranchCapacity(game, i)} · {expansionsOf(game, i)}/{RANCH_EXPANSION_MAX}
            </span>
          </button>
        ))}
      </div>
    </ConfirmDialog>
  )
}

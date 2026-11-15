import { useState } from 'react'
import { act } from '../../store/store'
import type { GameState } from '../../game/core/state'
import { BOOST_EXP_MULT, BOOST_TAP_EXP, luckyEggBlocker, spendLuckyEgg } from '../../game/run/expBoost'
import { ConfirmDialog } from '../shared/ConfirmDialog'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'
import { BagGroup, BagTile } from './BagParts'

const EFFECT = `toda la ruta: EXP ×${BOOST_EXP_MULT} en los combates, +${BOOST_TAP_EXP} EXP por cada toque caminando y los rivales al nivel de tu Pokémon`

/** Huevos Suerte de la Mochila: se usan aquí, con confirmación, para la próxima ruta */
export function LuckyEggGroup({ game }: { game: GameState }) {
  const [confirming, setConfirming] = useState(false)
  const armed = game.luckyEggArmed
  const use = () => {
    act(spendLuckyEgg)
    setConfirming(false)
  }
  return (
    <BagGroup title="Huevo Suerte" hint={armed ? `Preparado para la próxima ruta: ${EFFECT}.` : `Se gasta al usarlo: la próxima ruta, ${EFFECT}.`}>
      <BagTile
        icon={<ItemIcon item={ICON.ExpBoost} size={44} />}
        name={armed ? 'Activo en la próxima ruta' : 'Huevo Suerte'}
        count={game.luckyEggs}
        action={
          game.luckyEggs > 0 && (
            <button className="btn primary small" disabled={luckyEggBlocker(game) !== null} onClick={() => setConfirming(true)}>
              Usar
            </button>
          )
        }
      />
      {confirming && (
        <ConfirmDialog title="¿Usar un Huevo Suerte?" confirmLabel="Usar" onConfirm={use} onCancel={() => setConfirming(false)}>
          <p className="small">La próxima ruta que empieces, {EFFECT}. No se puede deshacer.</p>
        </ConfirmDialog>
      )}
    </BagGroup>
  )
}

import { INCURSIONS, MAX_KEYS, type Incursion } from '../../data/incursions'
import type { GameState } from '../../game/core/state'
import { act } from '../../game/core/store'
import { buyKey, buyKeyBlocker, keyPrice, keysOf } from '../../game/incursion/keys'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'
import { ShopSection, ShopTile } from './ShopTile'

/** Llaves de incursión a la venta: una por incursión, se guardan en la Mochila y se gasta una al entrar */
export function IncursionKeyShop({ game }: { game: GameState }) {
  return (
    <ShopSection
      title="Llaves de incursión"
      art={ICON.Incursion}
      tone="shop-fold-keys"
      hint={`Cada incursión pide su llave, y se gasta una al formarse el grupo. Puedes tener hasta ${MAX_KEYS} de cada una.`}
    >
      {INCURSIONS.map((inc) => (
        <KeyTile key={inc.id} game={game} inc={inc} />
      ))}
    </ShopSection>
  )
}

function KeyTile({ game, inc }: { game: GameState; inc: Incursion }) {
  return (
    <ShopTile
      icon={<ItemIcon item={ICON.Incursion} size={48} />}
      name={inc.name}
      action={
        <button className="btn primary small" disabled={!!buyKeyBlocker(game, inc.id)} onClick={() => act((s) => buyKey(s, inc.id))}>
          ₽ {keyPrice(inc.id).toLocaleString('es')}
        </button>
      }
    >
      <span className="tiny muted">
        Nv. {inc.minLevel}–{inc.maxLevel} · Tienes {keysOf(game, inc.id)}/{MAX_KEYS}
      </span>
    </ShopTile>
  )
}

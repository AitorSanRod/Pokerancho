import { useEffect, useState } from 'react'
import { INCURSIONS, MAX_KEYS, type Incursion } from '../../data/incursions'
import type { GameState } from '../../game/core/state'
import { act } from '../../game/core/store'
import { buyKey, buyKeyBlocker, keyPrice, keysOf } from '../../game/incursion/keys'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'
import { BuyButton } from './BuyButton'
import { clearShopSpot, isShopSpot } from '../shared/navigation'
import { ShopSection, ShopTile } from './ShopTile'

const SECTION_ID = 'shop-incursion-keys'

/** Llaves de incursión a la venta: una por incursión, se guardan en la Mochila y se gasta una al entrar */
export function IncursionKeyShop({ game }: { game: GameState }) {
  // Si se llegó desde «Comprar llave» de una incursión: abierta y a la vista
  const [cameForKeys] = useState(() => isShopSpot('keys'))
  useEffect(() => {
    if (!cameForKeys) return
    document.getElementById(SECTION_ID)?.scrollIntoView({ block: 'start', behavior: 'smooth' })
    clearShopSpot()
  }, [cameForKeys])

  return (
    <ShopSection
      id={SECTION_ID}
      defaultOpen={cameForKeys}
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
  const icon = <ItemIcon item={ICON.Incursion} size={48} />
  return (
    <ShopTile
      icon={icon}
      name={inc.name}
      action={
        <BuyButton
          name={`una llave de ${inc.name}`}
          icon={icon}
          price={keyPrice(inc.id)}
          money={game.money}
          disabled={!!buyKeyBlocker(game, inc.id)}
          onBuy={() => act((s) => buyKey(s, inc.id))}
        />
      }
    >
      <span className="tiny muted">
        Nv. {inc.minLevel}–{inc.maxLevel} · Tienes {keysOf(game, inc.id)}/{MAX_KEYS}
      </span>
    </ShopTile>
  )
}

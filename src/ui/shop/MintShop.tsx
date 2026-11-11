import type { GameState } from '../../game/core/state'
import { act } from '../../game/core/store'
import { buyMint, MINT_PRICE, mintsOf } from '../../game/team/mints'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'
import { BuyButton } from './BuyButton'
import { ShopSection, ShopTile } from './ShopTile'

const MINT_NAME = 'Menta aleatoria'

/** Menta aleatoria a la venta: se guarda en la Mochila y se gasta al cambiar la naturaleza de un Pokémon desde su ficha */
export function MintShop({ game }: { game: GameState }) {
  return (
    <ShopSection
      title="Mentas"
      art={ICON.Mint}
      tone="shop-fold-mints"
      hint="Cambia la naturaleza de un Pokémon por otra al azar, distinta de la que tiene. Se guarda en la Mochila y se gasta al usarla en la ficha, en Naturaleza."
    >
      <ShopTile
        icon={<ItemIcon item={ICON.Mint} size={48} />}
        name={MINT_NAME}
        action={
          <BuyButton
            name={MINT_NAME}
            icon={<ItemIcon item={ICON.Mint} size={40} />}
            price={MINT_PRICE}
            money={game.money}
            disabled={game.money < MINT_PRICE}
            onBuy={() => act((s) => buyMint(s))}
          />
        }
      >
        <span className="tiny muted">Tienes {mintsOf(game)}</span>
      </ShopTile>
    </ShopSection>
  )
}

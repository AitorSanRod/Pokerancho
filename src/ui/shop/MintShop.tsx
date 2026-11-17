import type { GameState } from '../../game/core/state'
import { act } from '../../store/store'
import { buyMint, MINT_PRICES, MintKind, mintsOf } from '../../game/team/mints'
import { ItemIcon } from '../shared/ItemIcon'
import { ICON } from '../shared/icons'
import { mintIcon, MINT_NAME } from '../shared/sheet/mintText'
import { BuyButton } from './BuyButton'
import { ShopSection, ShopTile } from './ShopTile'

/** Mentas a la venta (aleatoria y neutra): se guardan en la Mochila y se gastan al cambiar la naturaleza de un Pokémon desde su ficha */
export function MintShop({ game }: { game: GameState }) {
  return (
    <ShopSection
      title="Mentas"
      art={ICON.Mint}
      tone="shop-fold-mints"
      hint="Cambian la naturaleza de un Pokémon: la aleatoria, por otra al azar distinta de la que tiene; la neutra, por la neutra (no sube ni baja nada). Se guardan en la Mochila y se gastan al usarlas en la ficha, en Naturaleza."
    >
      {Object.values(MintKind).map((kind) => (
        <ShopTile
          key={kind}
          icon={<ItemIcon item={mintIcon(kind)} size={48} />}
          name={MINT_NAME[kind]}
          action={
            <BuyButton
              name={MINT_NAME[kind]}
              icon={<ItemIcon item={mintIcon(kind)} size={40} />}
              price={MINT_PRICES[kind]}
              money={game.money}
              disabled={game.money < MINT_PRICES[kind]}
              onBuy={() => act((s) => buyMint(s, kind))}
            />
          }
        >
          <span className="tiny muted">Tienes {mintsOf(game, kind)}</span>
        </ShopTile>
      ))}
    </ShopSection>
  )
}

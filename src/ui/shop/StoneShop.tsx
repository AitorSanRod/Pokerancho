import { STONE_IDS, STONES, type Stone } from '../../data/stones'
import type { GameState } from '../../game/core/state'
import { act } from '../../game/core/store'
import { buyStone, stonePrice, stonesOf } from '../../game/team/stones'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'
import { BuyButton } from './BuyButton'
import { ShopSection, ShopTile } from './ShopTile'

/** Objetos evolutivos (piedras y otros) a la venta: se guardan en la Mochila y se gastan al evolucionar desde la ficha del Pokémon */
export function StoneShop({ game }: { game: GameState }) {
  return (
    <ShopSection
      title="Objetos evolutivos"
      art={ICON.Evolve}
      tone="shop-fold-stones"
      hint="Algunos Pokémon evolucionan con una piedra u otro objeto, a cualquier nivel. Se guardan en la Mochila y se gastan al evolucionar."
    >
      {STONE_IDS.map((id) => (
        <StoneTile key={id} game={game} id={id} />
      ))}
    </ShopSection>
  )
}

function StoneTile({ game, id }: { game: GameState; id: Stone }) {
  const info = STONES[id]
  const price = stonePrice(id)
  const icon = <ItemIcon item={info.item} size={48} />
  return (
    <ShopTile
      icon={icon}
      name={info.name}
      action={<BuyButton name={info.name} icon={icon} price={price} money={game.money} disabled={game.money < price} onBuy={() => act((s) => buyStone(s, id))} />}
    >
      <span className="tiny muted">Tienes {stonesOf(game, id)}</span>
    </ShopTile>
  )
}

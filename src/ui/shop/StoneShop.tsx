import { STONE_IDS, STONES, type Stone } from '../../data/stones'
import type { GameState } from '../../game/core/state'
import { act } from '../../game/core/store'
import { buyStone, stonePrice, stonesOf } from '../../game/team/stones'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'
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
  return (
    <ShopTile
      icon={<ItemIcon item={info.item} size={48} />}
      name={info.name}
      action={
        <button className="btn primary small" disabled={game.money < price} onClick={() => act((s) => buyStone(s, id))}>
          ₽ {price}
        </button>
      }
    >
      <span className="tiny muted">Tienes {stonesOf(game, id)}</span>
    </ShopTile>
  )
}

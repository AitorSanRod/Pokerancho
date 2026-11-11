import type { Item } from '../../data/items'
import type { GameState } from '../../game/core/state'
import { act } from '../../game/core/store'
import { buyUpgrade, nextUpgradePrice, UPGRADE_IDS, UPGRADES, upgradeLevel, type UpgradeId } from '../../game/team/upgrades'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'
import { BuyButton } from './BuyButton'
import { RanchExpansionTile } from './RanchExpansionTile'
import { IncursionKeyShop } from './IncursionKeyShop'
import { RanchTypeShop } from './RanchTypeShop'
import './shop.css'
import { ShopSection, ShopTile } from './ShopTile'
import { StoneShop } from './StoneShop'
import { FormItemShop } from './FormItemShop'
import { MintShop } from './MintShop'

const UPGRADE_ICON: Record<UpgradeId, Item> = { expeditionSlots: ICON.Expedition, ranches: ICON.Ranch }

/** Pestaña Tienda: mejoras permanentes, tipos de rancho, objetos evolutivos, objetos de forma, mentas y llaves de incursión, cada grupo en su desplegable */
export function UpgradeShop({ game }: { game: GameState }) {
  return (
    <div className="screen scroll">
      <ShopSection title="Mejoras" art={ICON.Shop} tone="shop-fold-upgrades" defaultOpen>
        {UPGRADE_IDS.map((id) => (
          <UpgradeTile key={id} game={game} id={id} />
        ))}
        <RanchExpansionTile game={game} />
      </ShopSection>
      <RanchTypeShop game={game} />
      <StoneShop game={game} />
      <FormItemShop game={game} />
      <MintShop game={game} />
      <IncursionKeyShop game={game} />
    </div>
  )
}

function UpgradeTile({ game, id }: { game: GameState; id: UpgradeId }) {
  const info = UPGRADES[id]
  const level = upgradeLevel(game, id)
  const price = nextUpgradePrice(game, id)
  const icon = <ItemIcon item={UPGRADE_ICON[id]} size={48} />

  return (
    <ShopTile
      icon={icon}
      name={info.name}
      action={
        price === null ? (
          <span className="tag ok">Comprada</span>
        ) : (
          <BuyButton name={info.name} icon={icon} price={price} money={game.money} disabled={game.money < price} onBuy={() => act((s) => buyUpgrade(s, id))} />
        )
      }
    >
      <span className="tiny muted">{info.description}</span>
      <span className="tiny">
        Nivel {level}/{info.prices.length}
      </span>
    </ShopTile>
  )
}

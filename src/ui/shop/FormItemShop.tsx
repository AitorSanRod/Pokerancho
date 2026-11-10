import { FORM_ITEM_IDS, FORM_ITEMS, type FormItem } from '../../data/forms'
import { species } from '../../data/species'
import type { GameState } from '../../game/core/state'
import { act } from '../../game/core/store'
import { buyFormItem, buyFormItemBlocker, hasFormItem } from '../../game/team/forms'
import { Sprite } from '../shared/common'
import { ICON } from '../shared/icons'
import { ShopSection, ShopTile } from './ShopTile'

/** Objetos de forma de Rotom: se compran una vez, van a la Mochila y se usan desde la ficha siempre que se quiera */
export function FormItemShop({ game }: { game: GameState }) {
  return (
    <ShopSection
      title="Formas de Rotom"
      art={ICON.Form}
      tone="shop-fold-forms"
      hint="Con cada objeto, Rotom puede cambiar a su forma desde la ficha, gratis y las veces que quieras. Se compran una sola vez."
    >
      {FORM_ITEM_IDS.map((id) => (
        <FormItemTile key={id} game={game} id={id} />
      ))}
    </ShopSection>
  )
}

function FormItemTile({ game, id }: { game: GameState; id: FormItem }) {
  const info = FORM_ITEMS[id]
  return (
    <ShopTile
      icon={<Sprite id={info.formId} animated={false} size={48} />}
      name={info.name}
      action={
        hasFormItem(game, id) ? (
          <span className="tag ok">Comprado</span>
        ) : (
          <button className="btn primary small" disabled={!!buyFormItemBlocker(game, id)} onClick={() => act((s) => buyFormItem(s, id))}>
            ₽ {info.price}
          </button>
        )
      }
    >
      <span className="tiny muted">{species(info.formId).name}</span>
    </ShopTile>
  )
}

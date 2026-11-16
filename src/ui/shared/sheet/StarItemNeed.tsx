import { STAR_ITEMS, type StarItem } from '../../../data/starItems'
import { starItemsOf } from '../../../game/collection/starItems'
import type { GameState } from '../../../game/core/state'
import { ItemIcon } from '../ItemIcon'
import './sheet-panels.css'

/** Aviso destacado del objeto estelar que gasta crear o evolucionar: icono, nombre y cuántos tienes (la cuenta, en rojo si no hay) */
export function StarItemNeed({ game, item, action }: { game: GameState; item: StarItem; action: string }) {
  const held = starItemsOf(game, item)
  return (
    <div className={`star-item-need ${held > 0 ? 'ok' : 'missing'}`}>
      <ItemIcon item={STAR_ITEMS[item].item} size={40} off={held === 0} />
      <span className="grow">
        <span className="tiny muted star-item-need-action">{action} gasta</span>
        <strong className="small">1 {STAR_ITEMS[item].name}</strong>
      </span>
      <span className="star-item-need-held">Tienes {held}</span>
    </div>
  )
}

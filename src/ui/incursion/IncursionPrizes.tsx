import type { Item } from '../../data/items'
import { IncursionPrizeKind, RoomKind, type Incursion, type IncursionPrize } from '../../data/incursions'
import { species } from '../../data/species'
import { STAR_ITEMS } from '../../data/starItems'
import { tmName, TMS } from '../../data/tms'
import { formatCount, formatMoney, formatPercent } from '../shared/format'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'
import './incursion-prizes.css'

/** Icono y texto de una línea del premio final */
function prizeLine(p: IncursionPrize): { icon: Item; text: string } {
  switch (p.kind) {
    case IncursionPrizeKind.Money:
      return { icon: ICON.Money, text: formatMoney(p.amount) }
    case IncursionPrizeKind.Exp:
      return { icon: ICON.Exp, text: `${formatCount(p.amount)} EXP` }
    case IncursionPrizeKind.Tickets:
      return { icon: ICON.Ticket, text: `${formatCount(p.amount)} tickets` }
    case IncursionPrizeKind.Pieces:
      return { icon: ICON.Piece, text: `${formatCount(p.amount)} tickets de ${species(p.speciesId).name}` }
    case IncursionPrizeKind.StarItem:
      return { icon: STAR_ITEMS[p.item].item, text: `${formatCount(p.amount)} ${STAR_ITEMS[p.item].name}` }
    case IncursionPrizeKind.Tm:
      return { icon: TMS[p.tm].item, text: `${formatCount(p.amount)} ${tmName(p.tm)}` }
  }
}

/** Los premios de una incursión: lo que dan sus salas de combate en total y el premio final, con su probabilidad */
export function IncursionPrizes({ inc }: { inc: Incursion }) {
  const battles = inc.rooms.flatMap((r) => (r.kind === RoomKind.Battle ? [r.reward] : []))
  const money = battles.reduce((sum, r) => sum + r.money, 0)
  const exp = battles.reduce((sum, r) => sum + r.exp, 0)
  return (
    <div className="incursion-prizes small">
      <p className="tiny muted">
        Salas de combate ({battles.length}): {formatMoney(money)} y {formatCount(exp)} EXP en total
      </p>
      <ul>
        {inc.prizes.map((p, i) => {
          const { icon, text } = prizeLine(p)
          return (
            <li key={i}>
              <ItemIcon item={icon} size={24} />
              <span className="grow">{text}</span>
              {p.chance < 1 && <span className="tiny muted">{formatPercent(p.chance)}</span>}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/** Los premios plegados en «Premios» (tarjeta del tablón de incursiones y anuncio del menú) */
export function IncursionPrizesFold({ inc }: { inc: Incursion }) {
  return (
    <details className="schedule-card-prizes">
      <summary className="small">Premios</summary>
      <IncursionPrizes inc={inc} />
    </details>
  )
}

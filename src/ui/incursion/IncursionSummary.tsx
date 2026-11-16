import { useState } from 'react'
import { species } from '../../data/species'
import { STAR_ITEMS, type StarItem } from '../../data/starItems'
import { tmName, TMS, type Tm } from '../../data/tms'
import { boostedMoney } from '../../game/battle/rewards'
import { act } from '../../store/store'
import { collectIncursion } from '../../game/incursion/incursionGame'
import { IncursionOutcome } from '../../game/incursion/incursionRun'
import type { Earned } from '../../game/incursion/incursionRewards'
import { Sprite } from '../shared/common'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'
import { RewardOverlay, type RewardItem } from '../shared/RewardOverlay'
import { REWARD_COLOR, discoveryReward } from '../shared/rewardItems'
import { formatMoney } from '../shared/format'
import './incursion-finale.css'

const TITLE: Partial<Record<IncursionOutcome, string>> = {
  [IncursionOutcome.Win]: '¡Incursión superada!',
  [IncursionOutcome.Lose]: 'El grupo ha caído',
  [IncursionOutcome.Retreat]: 'El grupo se ha retirado',
}

/** Lo ganado como premios de pantalla completa; se omite lo que vale 0 */
function rewardItems(earned: Earned): RewardItem[] {
  const items: RewardItem[] = []
  const money = boostedMoney(earned.money)
  if (earned.exp > 0) items.push({ key: 'exp', icon: <ItemIcon item={ICON.Exp} size={96} />, title: `+${earned.exp} EXP`, color: REWARD_COLOR.exp })
  if (money > 0) items.push({ key: 'money', icon: <ItemIcon item={ICON.Money} size={96} />, title: `+${formatMoney(money)}`, color: REWARD_COLOR.money })
  if (earned.tickets > 0) items.push({ key: 'tickets', icon: <ItemIcon item={ICON.Ticket} size={96} />, title: `+${earned.tickets} tickets de gacha`, color: REWARD_COLOR.tickets })
  for (const [id, n] of Object.entries(earned.pieces)) {
    items.push({ key: `piece-${id}`, icon: <Sprite id={Number(id)} size={160} />, title: `Ticket de ${species(Number(id)).name} ×${n}`, color: REWARD_COLOR.pieces })
  }
  for (const [item, n] of Object.entries(earned.starItems) as [StarItem, number][]) {
    const info = STAR_ITEMS[item]
    items.push({ key: `star-${item}`, icon: <ItemIcon item={info.item} size={96} />, title: `+${n} ${n === 1 ? info.name : info.plural}`, color: '#4a6ad0' })
  }
  for (const [tm, n] of Object.entries(earned.tms) as [Tm, number][]) {
    items.push({ key: `tm-${tm}`, icon: <ItemIcon item={TMS[tm].item} size={96} />, title: `+${n} ${tmName(tm)}`, color: '#a8a878' })
  }
  return items
}

interface Props {
  outcome: IncursionOutcome
  earned: Earned
  /** Rivales derrotados que entran nuevos en la Pokédex al recoger */
  discovered: number[]
  /** Es gratuita y ya se cobró, así que no da nada */
  prizeSpent: boolean
}

/** Final de la incursión: cómo acabó, lo ganado, lo descubierto y el botón de recogerlo (el Pokémon vuelve al rancho) */
export function IncursionSummary({ outcome, earned, discovered, prizeSpent }: Props) {
  const [shown, setShown] = useState<RewardItem[] | null>(null)
  const items = [...discovered.map(discoveryReward), ...rewardItems(earned)]
  const collect = () => (items.length ? setShown(items) : act((s) => collectIncursion(s, Date.now())))

  return (
    <section className="card incursion-summary">
      <h3>{TITLE[outcome]}</h3>
      <p className="small">
        {prizeSpent
          ? 'Ya cobraste los premios de esta incursión: ahora es solo para practicar.'
          : outcome === IncursionOutcome.Win
            ? 'Te llevas lo ganado por el camino y el premio final.'
            : 'Te llevas lo ganado en las salas superadas.'}
      </p>
      <button className="btn primary" onClick={collect}>
        {items.length ? 'Recoger' : 'Volver al rancho'}
      </button>
      {shown && (
        <RewardOverlay
          title={TITLE[outcome] ?? ''}
          items={shown}
          onClose={() => {
            setShown(null)
            act((s) => collectIncursion(s, Date.now()))
          }}
        />
      )}
    </section>
  )
}

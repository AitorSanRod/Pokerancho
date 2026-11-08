import { useState } from 'react'
import { species } from '../../data/species'
import { boostedMoney } from '../../game/battle/rewards'
import { act } from '../../game/core/store'
import { collectIncursion } from '../../game/incursion/incursionGame'
import { IncursionOutcome } from '../../game/incursion/incursionRun'
import type { Earned } from '../../game/incursion/incursionRewards'
import { Sprite } from '../shared/common'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'
import { RewardOverlay, type RewardItem } from '../shared/RewardOverlay'

const TITLE: Partial<Record<IncursionOutcome, string>> = {
  [IncursionOutcome.Win]: '¡Incursión superada!',
  [IncursionOutcome.Lose]: 'El grupo ha caído',
  [IncursionOutcome.Retreat]: 'El grupo se ha retirado',
}

/** Lo ganado como premios de pantalla completa; se omite lo que vale 0 */
function rewardItems(earned: Earned): RewardItem[] {
  const items: RewardItem[] = []
  const money = boostedMoney(earned.money)
  if (earned.exp > 0) items.push({ key: 'exp', icon: <ItemIcon item={ICON.Exp} size={96} />, title: `+${earned.exp} EXP`, color: '#3a8fd8' })
  if (money > 0) items.push({ key: 'money', icon: <ItemIcon item={ICON.Money} size={96} />, title: `+₽ ${money}`, color: '#d8a020' })
  if (earned.tickets > 0) items.push({ key: 'tickets', icon: <ItemIcon item={ICON.Ticket} size={96} />, title: `+${earned.tickets} tickets de gacha`, color: '#c04040' })
  for (const [id, n] of Object.entries(earned.pieces)) {
    items.push({ key: `piece-${id}`, icon: <Sprite id={Number(id)} size={160} />, title: `Ticket de ${species(Number(id)).name} ×${n}`, color: '#8a5ab0' })
  }
  return items
}

/** Final de la incursión: cómo acabó, lo ganado y el botón de recogerlo (el Pokémon vuelve al rancho) */
export function IncursionSummary({ outcome, earned }: { outcome: IncursionOutcome; earned: Earned }) {
  const [shown, setShown] = useState<RewardItem[] | null>(null)
  const items = rewardItems(earned)
  const collect = () => (items.length ? setShown(items) : act((s) => collectIncursion(s, Date.now())))

  return (
    <section className="card incursion-summary">
      <h3>{TITLE[outcome]}</h3>
      <p className="small">
        {outcome === IncursionOutcome.Win ? 'Te llevas lo ganado por el camino y el premio final.' : 'Te llevas lo ganado en las salas superadas.'}
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

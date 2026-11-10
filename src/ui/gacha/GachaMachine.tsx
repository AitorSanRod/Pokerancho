import { useState } from 'react'
import { Rarity, RARITY_INFO } from '../../data/species'
import { STAR_ITEMS, type StarItem } from '../../data/starItems'
import { isSeen, knownName } from '../../game/collection/dex'
import { buyTicket, maxTicketsToBuy, pull, TICKET_PRICE, type PieceDrop, type PullResult } from '../../game/collection/gacha'
import type { GameState } from '../../game/core/state'
import { act } from '../../game/core/store'
import { Sprite } from '../shared/common'
import { RewardOverlay, type RewardItem } from '../shared/RewardOverlay'
import { CaptureBall } from './CaptureBall'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'
import { BigAction } from '../shared/sheet/MonSheet'
import { StepperAction } from '../shared/sheet/StepperAction'
import { GachaRates } from './GachaRates'

type Phase = 'idle' | 'capturing' | 'rewards'

/** Tickets de la tirada múltiple */
const MULTI_PULL = 10

/** Máquina de tiradas: gasta tickets y abre la Pokéball con las piezas */
export function GachaMachine({ game }: { game: GameState }) {
  const [drops, setDrops] = useState<PullResult>({ pieces: [], money: [], starItems: [] })
  const [phase, setPhase] = useState<Phase>('idle')
  // Al tirar tocando la Pokéball no hay caída: ya está ahí y empieza a balancearse
  const [fromBall, setFromBall] = useState(false)
  // Tickets de gacha que se van a comprar, elegidos sin aceptar: siempre al menos 1
  const [buying, setBuying] = useState(1)

  const canPullOne = phase === 'idle' && game.tickets >= 1

  const roll = (count: number, tappedBall = false) => {
    const res = act((s) => pull(s, count))
    if (res.pieces.length === 0 && res.money.length === 0 && res.starItems.length === 0) return
    setFromBall(tappedBall)
    setDrops(res)
    setPhase('capturing')
  }

  return (
    <>
      <div className="card gacha-machine">
        <div className="gacha-stage">
          {phase === 'capturing' ? (
            <CaptureBall glow={RARITY_INFO[bestRarity(drops)].color} drop={!fromBall} onOpen={() => setPhase('rewards')} />
          ) : (
            // Tocar la Pokéball equivale a «Tirar x1»; sin tickets se ve desactivada
            <button
              className="pokeball-button"
              disabled={!canPullOne}
              onClick={() => roll(1, true)}
              aria-label="Tirar x1 (1 ticket de gacha)"
            >
              <span className="pokeball" />
            </button>
          )}
        </div>
        <BigAction
          icon={ICON.Gacha}
          label="Tirar x1"
          price={1}
          priceIcon={ICON.Ticket}
          disabled={!canPullOne}
          className="primary"
          onClick={() => roll(1)}
        />
        <BigAction
          icon={ICON.Gacha}
          label={`Tirar x${MULTI_PULL}`}
          price={MULTI_PULL}
          priceIcon={ICON.Ticket}
          disabled={phase !== 'idle' || game.tickets < MULTI_PULL}
          className="primary"
          onClick={() => roll(MULTI_PULL)}
        />
        {/* Gasta de una vez todos los tickets que haya */}
        <BigAction
          icon={ICON.Gacha}
          label="Abrir todos"
          price={Math.max(1, game.tickets)}
          priceIcon={ICON.Ticket}
          disabled={!canPullOne}
          className="primary"
          onClick={() => roll(game.tickets)}
        />
        <StepperAction
          icon={ICON.Ticket}
          label={(n) => (n > 0 ? `Comprar ${n} ${n === 1 ? 'ticket' : 'tickets'}` : 'Comprar tickets')}
          price={(n) => Math.max(1, n) * TICKET_PRICE}
          count={buying}
          min={1}
          max={maxTicketsToBuy(game)}
          onChange={setBuying}
          onAccept={() => {
            act((s) => buyTicket(s, buying))
            setBuying(1)
          }}
        />
      </div>
      <GachaRates game={game} />

      {phase === 'rewards' && (
        <RewardOverlay
          title="¡Tickets conseguidos!"
          items={[...moneyRewards(drops.money), ...pieceRewards(game, drops.pieces), ...starItemRewards(drops.starItems)]}
          fadeIn={false}
          onClose={() => setPhase('idle')}
        />
      )}
    </>
  )
}

/** La rareza más alta de lo que ha salido (piezas y objetos estelares): da el color de la Pokéball */
function bestRarity({ pieces, starItems }: PullResult): Rarity {
  const rarities = [...pieces.map((d) => d.rarity), ...starItems.map((id) => STAR_ITEMS[id].rarity)]
  return rarities.reduce<Rarity>((best, r) => (RARITY_INFO[r].rate < RARITY_INFO[best].rate ? r : best), Rarity.Common)
}

/** Agrupa el dinero por premio («+₽ 250 ×2»), antes que las piezas */
function moneyRewards(money: number[]): RewardItem[] {
  const counts = new Map<number, number>()
  for (const amount of money) counts.set(amount, (counts.get(amount) ?? 0) + 1)
  return [...counts].map(([amount, count]) => ({
    key: `money-${amount}`,
    icon: <ItemIcon item={ICON.Money} size={96} />,
    title: count > 1 ? `+₽ ${amount} ×${count}` : `+₽ ${amount}`,
    color: '#d8a020',
  }))
}

/** Agrupa las piezas por especie («Pidgey ×2»); las más raras salen al final y las no vistas, en silueta */
function pieceRewards(game: GameState, drops: PieceDrop[]): RewardItem[] {
  const counts = new Map<number, PieceDrop & { count: number }>()
  for (const d of drops) counts.set(d.speciesId, { ...d, count: (counts.get(d.speciesId)?.count ?? 0) + 1 })
  return [...counts.values()]
    .sort((a, b) => RARITY_INFO[b.rarity].rate - RARITY_INFO[a.rarity].rate)
    .map((d) => ({
      key: String(d.speciesId),
      icon: <Sprite id={d.speciesId} size={160} silhouette={!isSeen(game, d.speciesId)} />,
      title: `Ticket de ${knownName(game, d.speciesId)} ×${d.count}`,
      color: RARITY_INFO[d.rarity].color,
    }))
}

/** Agrupa los objetos estelares («Trozo de estrella ×2»): salen los últimos, como lo más valioso */
function starItemRewards(items: StarItem[]): RewardItem[] {
  const counts = new Map<StarItem, number>()
  for (const id of items) counts.set(id, (counts.get(id) ?? 0) + 1)
  return [...counts]
    .sort(([a], [b]) => RARITY_INFO[STAR_ITEMS[b].rarity].rate - RARITY_INFO[STAR_ITEMS[a].rarity].rate)
    .map(([id, count]) => ({
      key: id,
      icon: <ItemIcon item={STAR_ITEMS[id].item} size={96} />,
      title: count > 1 ? `${STAR_ITEMS[id].name} ×${count}` : STAR_ITEMS[id].name,
      color: RARITY_INFO[STAR_ITEMS[id].rarity].color,
    }))
}

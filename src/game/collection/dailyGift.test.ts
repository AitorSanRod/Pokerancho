import { describe, expect, it } from 'vitest'
import { DAILY_GIFTS, type DailyGift } from '../../data/dailyGifts'
import { STAR_ITEM_IDS } from '../../data/starItems'
import { initialState } from '../core/state'
import { applyGift, canClaimGift, claimGift, DAILY_GIFT_INTERVAL_MS, giftAt, giftAvailableAt, giftStarItems, noGiftsYet } from './dailyGift'
import { starItemsOf } from './starItems'

const [ITEM, OTHER] = STAR_ITEM_IDS

const T0 = 1_000_000

describe('obsequio diario', () => {
  it('el primero se puede recoger enseguida y es el primero de la lista', () => {
    const st = noGiftsYet()
    expect(canClaimGift(st, T0)).toBe(true)
    expect(claimGift(st, T0)).toEqual(DAILY_GIFTS[0])
  })

  it('después hay que esperar DAILY_GIFT_INTERVAL_MS para el siguiente', () => {
    const st = noGiftsYet()
    claimGift(st, T0)
    expect(claimGift(st, T0 + DAILY_GIFT_INTERVAL_MS - 1)).toBeNull()
    expect(giftAvailableAt(st)).toBe(T0 + DAILY_GIFT_INTERVAL_MS)
    expect(claimGift(st, T0 + DAILY_GIFT_INTERVAL_MS)).toEqual(DAILY_GIFTS[1 % DAILY_GIFTS.length])
  })

  it('aunque pasen muchos días sin entrar, toca el siguiente de la lista (no se reinicia)', () => {
    const st = noGiftsYet()
    claimGift(st, T0)
    expect(claimGift(st, T0 + 30 * DAILY_GIFT_INTERVAL_MS)).toEqual(DAILY_GIFTS[1 % DAILY_GIFTS.length])
  })

  it('al acabar la lista vuelve a empezar', () => {
    const st = noGiftsYet()
    for (let day = 0; day < DAILY_GIFTS.length; day++) claimGift(st, T0 + day * DAILY_GIFT_INTERVAL_MS)
    expect(giftAt(st.claimed)).toEqual(DAILY_GIFTS[0])
  })

  it('al recogerlo se suman a la partida el dinero, los trozos, los tickets y los objetos estelares', () => {
    const s = initialState()
    const before = { money: s.money, shards: s.missingnoShards, tickets: s.tickets }
    const gift = { money: 7, missingnoShards: 5, tickets: 3, starItems: { [ITEM]: 2 }, big: false }
    applyGift(s, gift)
    expect(starItemsOf(s, ITEM)).toBe(2)
    expect({ money: s.money, shards: s.missingnoShards, tickets: s.tickets }).toEqual({
      money: before.money + gift.money,
      shards: before.shards + gift.missingnoShards,
      tickets: before.tickets + gift.tickets,
    })
  })

  it('los objetos estelares que no encajan se ignoran: sin campo (servidor viejo), desconocidos o no enteros', () => {
    const base = { money: 0, missingnoShards: 0, tickets: 0, big: false }
    expect(giftStarItems(base as unknown as DailyGift)).toEqual([])
    const odd = { ...base, starItems: { [ITEM]: 1.5, [OTHER]: 1, quitado: 3 } } as unknown as DailyGift
    expect(giftStarItems(odd)).toEqual([[OTHER, 1]])
  })
})

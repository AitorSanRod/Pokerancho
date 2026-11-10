import { describe, expect, it } from 'vitest'
import { Rarity, STARTERS } from '../../data/species'
import { STAR_ITEM_IDS } from '../../data/starItems'
import { TM_IDS } from '../../data/tms'
import { starItemsOf } from '../collection/starItems'
import { tmsOf } from '../incursion/tms'
import { toggleFavorite, markSeen } from '../collection/dex'
import { initialState, type GameState } from '../core/state'
import { chooseStarter, speciesOfRarity } from '../core/test-utils'
import { createMon } from '../team/mons'
import { canPay, givableMons, giveMonBlocker, payAsk, payBlocker, payOptions, takeOffer } from './tradeGive'
import { GoodKind, type TradeAsk } from './tradeGoods'

const [A, B, C] = STARTERS

/** Partida con el inicial A de compañero, B en el rancho y C en la Caja */
function game(): GameState {
  const s = initialState()
  chooseStarter(s, A)
  s.owned.push({ ...createMon(B, 12), stars: 2, exp: 7 }, createMon(C, 3, null))
  return s
}
const uidOf = (s: GameState, speciesId: number) => s.owned.find((m) => m.speciesId === speciesId)!.uid

describe('dar Pokémon', () => {
  it('se pueden dar los del rancho y la Caja, pero no el compañero', () => {
    const s = game()
    expect(givableMons(s).map((m) => m.speciesId)).toEqual([B, C])
    expect(giveMonBlocker(s, uidOf(s, A))).not.toBeNull()
    expect(giveMonBlocker(s, uidOf(s, C))).toBeNull()
  })

  it('los favoritos salen en la lista pero no se pueden dar', () => {
    const s = game()
    markSeen(s, B)
    toggleFavorite(s, B)
    expect(givableMons(s).map((m) => m.speciesId)).toContain(B)
    expect(giveMonBlocker(s, uidOf(s, B))).not.toBeNull()
    expect(takeOffer(s, { kind: GoodKind.Mon, uid: uidOf(s, B) })).toBeNull()
  })

  it('al anunciar un Pokémon sale de la partida tal cual estaba', () => {
    const s = game()
    const good = takeOffer(s, { kind: GoodKind.Mon, uid: uidOf(s, B) })
    expect(good).toMatchObject({ kind: GoodKind.Mon, mon: { speciesId: B, level: 12, exp: 7, stars: 2, tmMoves: [] } })
    expect(s.owned.some((m) => m.speciesId === B)).toBe(false)
  })
})

describe('anunciar tickets y trozos', () => {
  it('solo los que se tienen y no de favoritos', () => {
    const s = game()
    const sp = speciesOfRarity(Rarity.Common)
    s.pieces[sp] = 4
    expect(takeOffer(s, { kind: GoodKind.Pieces, speciesId: sp, count: 5 })).toBeNull()
    expect(takeOffer(s, { kind: GoodKind.Pieces, speciesId: sp, count: 3 })).toEqual({ kind: GoodKind.Pieces, speciesId: sp, count: 3 })
    expect(s.pieces[sp]).toBe(1)
    markSeen(s, sp)
    toggleFavorite(s, sp)
    expect(takeOffer(s, { kind: GoodKind.Pieces, speciesId: sp, count: 1 })).toBeNull()
  })

  it('los trozos, solo si llegan', () => {
    const s = game()
    s.missingnoShards = 10
    expect(takeOffer(s, { kind: GoodKind.Shards, count: 11 })).toBeNull()
    expect(takeOffer(s, { kind: GoodKind.Shards, count: 10 })).not.toBeNull()
    expect(s.missingnoShards).toBe(0)
  })
})

describe('pagar un anuncio', () => {
  it('con un Pokémon de una de las especies pedidas', () => {
    const s = game()
    const ask: TradeAsk = { kind: GoodKind.Mon, speciesIds: [C, B] }
    expect(payOptions(s, ask).map((m) => m.speciesId).sort()).toEqual([B, C].sort())
    expect(canPay(s, ask)).toBe(true)
    expect(canPay(s, { kind: GoodKind.Mon, speciesIds: [A] })).toBe(false)
    expect(payBlocker(s, ask, null)).not.toBeNull()
    expect(payBlocker(s, { kind: GoodKind.Mon, speciesIds: [A] }, uidOf(s, A))).not.toBeNull()
    expect(payAsk(s, ask, uidOf(s, C))).toMatchObject({ kind: GoodKind.Mon, mon: { speciesId: C } })
    expect(s.owned.some((m) => m.speciesId === C)).toBe(false)
  })

  it('con dinero, trozos o tickets si llegan', () => {
    const s = game()
    Object.assign(s, { money: 100, missingnoShards: 5, tickets: 2 })
    expect(canPay(s, { kind: GoodKind.Money, count: 101 })).toBe(false)
    expect(payAsk(s, { kind: GoodKind.Money, count: 101 }, null)).toBeNull()
    expect(payAsk(s, { kind: GoodKind.Money, count: 100 }, null)).toEqual({ kind: GoodKind.Money, count: 100 })
    expect(payAsk(s, { kind: GoodKind.Shards, count: 5 }, null)).not.toBeNull()
    expect(payAsk(s, { kind: GoodKind.Tickets, count: 2 }, null)).not.toBeNull()
    expect(s).toMatchObject({ money: 0, missingnoShards: 0, tickets: 0 })
  })
})

describe('objetos estelares', () => {
  const ITEM = STAR_ITEM_IDS[0]

  it('se ofrecen y se pagan solo si llegan', () => {
    const s = game()
    s.starItems[ITEM] = 3
    expect(takeOffer(s, { kind: GoodKind.StarItem, item: ITEM, count: 4 })).toBeNull()
    expect(takeOffer(s, { kind: GoodKind.StarItem, item: ITEM, count: 2 })).toEqual({ kind: GoodKind.StarItem, item: ITEM, count: 2 })
    const ask: TradeAsk = { kind: GoodKind.StarItem, item: ITEM, count: 2 }
    expect(canPay(s, ask)).toBe(false)
    expect(payAsk(s, { ...ask, count: 1 }, null)).toEqual({ ...ask, count: 1 })
    expect(starItemsOf(s, ITEM)).toBe(0)
  })
})

describe('MTs', () => {
  const [TM] = TM_IDS

  it('se ofrecen y se pagan solo si llegan', () => {
    const s = game()
    s.tms[TM] = 3
    expect(takeOffer(s, { kind: GoodKind.Tm, tm: TM, count: 4 })).toBeNull()
    expect(takeOffer(s, { kind: GoodKind.Tm, tm: TM, count: 2 })).toEqual({ kind: GoodKind.Tm, tm: TM, count: 2 })
    const ask: TradeAsk = { kind: GoodKind.Tm, tm: TM, count: 2 }
    expect(canPay(s, ask)).toBe(false)
    expect(payAsk(s, { ...ask, count: 1 }, null)).toEqual({ ...ask, count: 1 })
    expect(tmsOf(s, TM)).toBe(0)
  })

  it('un Pokémon se va con lo que aprendió con MTs', () => {
    const s = game()
    s.owned.find((m) => m.speciesId === B)!.tmMoves = [TM]
    const good = takeOffer(s, { kind: GoodKind.Mon, uid: uidOf(s, B) })
    expect(good).toMatchObject({ mon: { tmMoves: [TM] } })
  })
})

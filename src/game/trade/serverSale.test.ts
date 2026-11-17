import { describe, expect, it } from 'vitest'
import { Rarity, STARTERS } from '../../data/species'
import { markSeen, toggleFavorite } from '../collection/dex'
import { initialState } from '../core/state'
import { chooseStarter, speciesOfRarity } from '../core/test-utils'
import { createMon } from '../team/mons'
import { favoriteMons, MON_SALE_PRICE, pieceSalePrice, SHARD_SALE_PRICE, sellMon, sellPieces, sellShards } from './serverSale'
import { FavoritePolicy } from './tradeGive'

const [A] = STARTERS

function game() {
  const s = initialState()
  chooseStarter(s, A)
  s.money = 0
  return s
}

describe('venta al servidor', () => {
  it.each(Object.values(Rarity))('un Pokémon %s se paga según su rareza', (rarity) => {
    const s = game()
    const mon = createMon(speciesOfRarity(rarity), 5)
    s.owned.push(mon)
    expect(sellMon(s, mon.uid)).toBe(MON_SALE_PRICE[rarity])
    expect(s.money).toBe(MON_SALE_PRICE[rarity])
    expect(s.owned).toHaveLength(1)
  })

  it('el compañero no se vende', () => {
    const s = game()
    expect(sellMon(s, s.activeUid!)).toBe(0)
    expect(s.owned).toHaveLength(1)
  })

  it('tickets según la rareza, solo los que hay y no de favoritos', () => {
    const s = game()
    const sp = speciesOfRarity(Rarity.Epic)
    s.pieces[sp] = 3
    expect(sellPieces(s, sp, 4)).toBe(0)
    expect(sellPieces(s, sp, 2)).toBe(2 * pieceSalePrice(sp))
    markSeen(s, sp)
    toggleFavorite(s, sp)
    expect(sellPieces(s, sp, 1)).toBe(0)
    expect(s.pieces[sp]).toBe(1)
  })

  it('trozos de MissingNo', () => {
    const s = game()
    s.missingnoShards = 5
    expect(sellShards(s, 6)).toBe(0)
    expect(sellShards(s, 5)).toBe(5 * SHARD_SALE_PRICE)
    expect(s.missingnoShards).toBe(0)
  })

  it('desde la sección de favoritos sí se venden sus Pokémon y sus tickets', () => {
    const s = game()
    const sp = speciesOfRarity(Rarity.Epic)
    const mon = createMon(sp, 5)
    s.owned.push(mon)
    s.pieces[sp] = 2
    markSeen(s, sp)
    toggleFavorite(s, sp)
    expect(sellMon(s, mon.uid)).toBe(0)
    expect(sellPieces(s, sp, 1)).toBe(0)
    expect(favoriteMons(s).map((m) => m.uid)).toEqual([mon.uid])
    expect(sellPieces(s, sp, 1, FavoritePolicy.Allow)).toBe(pieceSalePrice(sp))
    expect(sellMon(s, mon.uid, FavoritePolicy.Allow)).toBe(MON_SALE_PRICE[Rarity.Epic])
    expect(favoriteMons(s)).toEqual([])
  })

  it('el compañero no se vende ni siendo favorito y desde su sección', () => {
    const s = game()
    toggleFavorite(s, s.owned[0].speciesId)
    expect(favoriteMons(s)).toEqual([])
    expect(sellMon(s, s.activeUid!, FavoritePolicy.Allow)).toBe(0)
  })
})

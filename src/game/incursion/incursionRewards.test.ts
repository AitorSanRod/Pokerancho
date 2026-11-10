import { describe, expect, it } from 'vitest'
import { IncursionPrizeKind, type IncursionPrize } from '../../data/incursions'
import { POKEMON } from '../../data/pokemon'
import { STAR_ITEM_IDS } from '../../data/starItems'
import { seqRng } from '../core/test-utils'
import { addEarnings, noEarnings, rollPrizes } from './incursionRewards'

const prizes: IncursionPrize[] = [
  { kind: IncursionPrizeKind.Money, amount: 100, chance: 1 },
  { kind: IncursionPrizeKind.Pieces, speciesId: POKEMON.Lapras, amount: 2, chance: 0.5 },
  { kind: IncursionPrizeKind.Pieces, speciesId: POKEMON.Lapras, amount: 1, chance: 0.5 },
  { kind: IncursionPrizeKind.StarItem, item: STAR_ITEM_IDS[0], amount: 1, chance: 0.5 },
]

describe('premios de incursión', () => {
  it('cada línea se tira por separado con su probabilidad', () => {
    expect(rollPrizes(prizes, seqRng(0.4))).toEqual({ ...noEarnings(), money: 100, pieces: { [POKEMON.Lapras]: 3 }, starItems: { [STAR_ITEM_IDS[0]]: 1 } })
    expect(rollPrizes(prizes, seqRng(0.6))).toEqual({ ...noEarnings(), money: 100 })
  })

  it('se suman lo de las salas y los tickets de especie', () => {
    const total = addEarnings(addEarnings(noEarnings(), { money: 5, pieces: { 1: 1 } }), { exp: 3, pieces: { 1: 2 } })
    expect(total).toEqual({ money: 5, exp: 3, tickets: 0, pieces: { 1: 3 }, starItems: {} })
    const items = addEarnings(addEarnings(noEarnings(), { starItems: { [STAR_ITEM_IDS[0]]: 1 } }), { starItems: { [STAR_ITEM_IDS[0]]: 2 } })
    expect(items.starItems).toEqual({ [STAR_ITEM_IDS[0]]: 3 })
  })
})

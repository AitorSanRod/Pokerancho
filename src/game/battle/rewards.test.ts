import { describe, expect, it } from 'vitest'
import { Rarity } from '../../data/species'
import { speciesOfRarity } from '../core/test-utils'
import { expToNext } from '../team/stats'
import {
  boostedMoney,
  EXP_LEVEL_GAP,
  EXP_LEVEL_SCALE,
  EXP_PER_LEVEL,
  expForLevel,
  expReward,
  MONEY_GAIN_MULT,
  moneyPerStep,
  moneyReward,
  MONEY_SPREAD,
  PIECE_DROP_CHANCE,
  pieceReward,
  TICKET_DROP_CHANCE,
  ticketReward,
} from './rewards'

const RARITIES = Object.values(Rarity)

describe('pieceReward', () => {
  it.each(RARITIES)('con rareza %s suelta pieza justo por debajo de su probabilidad', (rarity) => {
    const id = speciesOfRarity(rarity)
    expect(pieceReward(id, () => PIECE_DROP_CHANCE[rarity] - 0.001)).toBe(true)
    expect(pieceReward(id, () => PIECE_DROP_CHANCE[rarity])).toBe(false)
  })
})

describe('ticketReward', () => {
  it.each(RARITIES)('con rareza %s suelta ticket justo por debajo de su probabilidad', (rarity) => {
    const id = speciesOfRarity(rarity)
    expect(ticketReward(id, () => TICKET_DROP_CHANCE[rarity] - 0.001)).toBe(1)
    expect(ticketReward(id, () => TICKET_DROP_CHANCE[rarity])).toBe(0)
  })
})

describe('moneyReward', () => {
  it('da los pasos del tramo por el ₽ por paso de su nivel, ±MONEY_SPREAD al azar y con el multiplicador de dinero', () => {
    const [level, steps] = [5, 100]
    const base = steps * moneyPerStep(level)
    expect(moneyReward(level, steps, () => 0.5)).toBe(boostedMoney(base))
    expect(moneyReward(level, steps, () => 0)).toBe(boostedMoney(base * (1 - MONEY_SPREAD)))
    expect(moneyReward(level, steps, () => 1)).toBe(boostedMoney(base * (1 + MONEY_SPREAD)))
  })

  it('crece con los pasos del tramo y nunca baja de 1', () => {
    expect(moneyReward(5, 80, () => 0.5)).toBeGreaterThan(moneyReward(5, 20, () => 0.5))
    expect(moneyReward(1, 0, () => 0)).toBe(1)
  })

  it('boostedMoney aplica MONEY_GAIN_MULT y redondea', () => {
    const amount = 1000
    expect(boostedMoney(amount)).toBe(Math.round(amount * MONEY_GAIN_MULT))
    expect(boostedMoney(0)).toBe(0)
  })

  it('crece con el nivel del rival', () => {
    expect(moneyReward(10, 30, () => 0)).toBeGreaterThan(moneyReward(2, 30, () => 0))
  })
})

describe('expReward', () => {
  it('da EXP según el nivel del rival', () => {
    expect(expReward(10, 10)).toBe(expForLevel(10))
    expect(expReward(12, 10)).toBeGreaterThan(expReward(10, 10))
  })

  it('crece más deprisa que el nivel del rival', () => {
    expect(expForLevel(EXP_LEVEL_SCALE)).toBe(2 * EXP_LEVEL_SCALE * EXP_PER_LEVEL)
    expect(expForLevel(2 * EXP_LEVEL_SCALE) / expForLevel(EXP_LEVEL_SCALE)).toBeGreaterThan(2)
  })

  it('hacen falta menos victorias por nivel que el propio nivel', () => {
    for (const level of [20, 40, 60, 90]) expect(expToNext(level) / expForLevel(level)).toBeLessThan(level)
  })

  it(`no da EXP si el rival tiene más de ${EXP_LEVEL_GAP} niveles menos`, () => {
    expect(expReward(20 - EXP_LEVEL_GAP, 20)).toBeGreaterThan(0)
    expect(expReward(20 - EXP_LEVEL_GAP - 1, 20)).toBe(0)
  })
})

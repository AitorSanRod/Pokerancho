import { describe, expect, it } from 'vitest'
import { initialState } from '../core/state'
import { buyRanchExpansion, expandableRanches, expansionBlocker, RANCH_EXPANSION_MAX, RANCH_EXPANSION_PRICE, RANCH_EXPANSION_SLOTS } from './ranchExpansion'
import { SPECIES } from '../../data/species'
import { createMon, NEW_MON_LEVEL } from './mons'
import { fitsInRanch, RANCH_SLOTS, ranchCapacity, slotsOf, usedSlots } from './ranches'
import { buyUpgrade, UPGRADES } from './upgrades'

const ONE_SLOT = SPECIES.find((sp) => slotsOf(sp.id) === 1)!.id

const richState = (times = 1) => {
  const s = initialState()
  s.money = RANCH_EXPANSION_PRICE * times
  return s
}

describe('Ampliación de rancho', () => {
  it('cobra su precio y suma sus espacios solo al rancho elegido', () => {
    const s = richState()
    s.money += UPGRADES.ranches.prices[0]
    buyUpgrade(s, 'ranches')
    expect(buyRanchExpansion(s, 1)).toBe(true)
    expect(s.money).toBe(0)
    expect(ranchCapacity(s, 1)).toBe(RANCH_SLOTS + RANCH_EXPANSION_SLOTS)
    expect(ranchCapacity(s, 0)).toBe(RANCH_SLOTS)
  })

  it('cada rancho admite como mucho RANCH_EXPANSION_MAX ampliaciones', () => {
    const s = richState(RANCH_EXPANSION_MAX + 1)
    for (let i = 0; i < RANCH_EXPANSION_MAX; i++) expect(buyRanchExpansion(s, 0)).toBe(true)
    expect(ranchCapacity(s, 0)).toBe(RANCH_SLOTS + RANCH_EXPANSION_MAX * RANCH_EXPANSION_SLOTS)
    expect(expansionBlocker(s, 0)).not.toBeNull()
    expect(buyRanchExpansion(s, 0)).toBe(false)
    expect(s.money).toBe(RANCH_EXPANSION_PRICE)
  })

  it('solo se ofrecen los ranchos que aún se pueden ampliar', () => {
    const s = richState(RANCH_EXPANSION_MAX)
    s.money += UPGRADES.ranches.prices[0]
    buyUpgrade(s, 'ranches')
    for (let i = 0; i < RANCH_EXPANSION_MAX; i++) buyRanchExpansion(s, 0)
    expect(expandableRanches(s)).toEqual([1])
  })

  it('en un rancho lleno vuelven a caber Pokémon al ampliarlo', () => {
    const s = richState()
    while (usedSlots(s, 0) < RANCH_SLOTS) s.owned.push(createMon(ONE_SLOT, NEW_MON_LEVEL))
    expect(fitsInRanch(s, 0, ONE_SLOT)).toBe(false)
    buyRanchExpansion(s, 0)
    expect(fitsInRanch(s, 0, ONE_SLOT)).toBe(true)
  })

  it('sin dinero o en un rancho que no es suyo no se compra nada', () => {
    const poor = initialState()
    poor.money = RANCH_EXPANSION_PRICE - 1
    expect(expansionBlocker(poor, 0)).not.toBeNull()
    expect(buyRanchExpansion(poor, 0)).toBe(false)
    const s = richState()
    expect(buyRanchExpansion(s, 1)).toBe(false)
    expect(s.money).toBe(RANCH_EXPANSION_PRICE)
    expect(s.ranchExtraSlots).toEqual({})
  })
})

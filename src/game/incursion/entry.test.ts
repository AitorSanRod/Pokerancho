import { describe, expect, it } from 'vitest'
import { INCURSIONS } from '../../data/incursions'
import { canEnter, EntryBlock, entryBlock } from './entry'
import { testIncursion } from './incursion-test-utils'

const MIN = 10
const MAX = 20
const inc = { ...testIncursion([]), minLevel: MIN, maxLevel: MAX }

describe('entrar en una incursión', () => {
  it('pueden entrar los Pokémon entre el nivel mínimo y el máximo, ambos incluidos', () => {
    expect(canEnter(inc, MIN)).toBe(true)
    expect(canEnter(inc, MAX)).toBe(true)
  })

  it('dice por qué no puede entrar uno de menos o de más nivel', () => {
    expect(entryBlock(inc, MIN - 1)).toBe(EntryBlock.TooLow)
    expect(entryBlock(inc, MAX + 1)).toBe(EntryBlock.TooHigh)
  })

  it('en todas las incursiones el máximo no baja del mínimo', () => {
    for (const i of INCURSIONS) expect(i.maxLevel).toBeGreaterThanOrEqual(i.minLevel)
  })
})

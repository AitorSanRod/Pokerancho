import { describe, expect, it } from 'vitest'
import { INCURSIONS } from '../../data/incursions'
import { canEnter, EntryBlock, entryBlock, foeLevels } from './entry'
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

  it('la franja de nivel de los rivales va del más bajo al más alto de todas sus salas', () => {
    const levels = INCURSIONS[0].rooms.flatMap((r) => ('foes' in r ? r.foes.map((f) => f.level) : []))
    expect(foeLevels(INCURSIONS[0])).toEqual([Math.min(...levels), Math.max(...levels)])
  })

  it('en todas las incursiones el máximo no baja del mínimo', () => {
    for (const i of INCURSIONS) expect(i.maxLevel).toBeGreaterThanOrEqual(i.minLevel)
  })
})

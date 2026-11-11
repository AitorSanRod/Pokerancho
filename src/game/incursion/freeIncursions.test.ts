import { afterEach, describe, expect, it, vi } from 'vitest'
import { initialState } from '../core/state'
import { freePrizeSpent, markFreePlayed, payableEarnings } from './freeIncursions'
import { TEST_INCURSION } from './incursion-test-mock'
import { noEarnings, type Earned } from './incursionRewards'

vi.mock('../../data/incursions', () => import('./incursion-test-mock'))

const ID = TEST_INCURSION.id
const EARNED: Earned = { ...noEarnings(), money: 100, exp: 50, tickets: 1 }

afterEach(() => {
  delete TEST_INCURSION.free
})

describe('incursiones gratuitas', () => {
  it('la primera vez se cobra todo; después, nada', () => {
    TEST_INCURSION.free = true
    const s = initialState()
    expect(payableEarnings(s, ID, EARNED)).toEqual(EARNED)
    markFreePlayed(s, ID)
    expect(freePrizeSpent(s, ID)).toBe(true)
    expect(payableEarnings(s, ID, EARNED)).toEqual(noEarnings())
    markFreePlayed(s, ID)
    expect(s.freeIncursionsPlayed).toEqual([ID])
  })

  it('las de llave dan su premio siempre', () => {
    const s = initialState()
    markFreePlayed(s, ID)
    expect(s.freeIncursionsPlayed).toEqual([])
    expect(payableEarnings(s, ID, EARNED)).toEqual(EARNED)
  })
})

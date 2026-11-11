import { afterEach, describe, expect, it, vi } from 'vitest'
import { INCURSIONS, KEY_PRICE, MAX_KEYS } from '../../data/incursions'
import { initialState } from '../core/state'
import { TEST_INCURSION } from './incursion-test-mock'
import { buyKey, buyKeyBlocker, canAffordEntry, keyPrice, keysOf, spendKey } from './keys'

vi.mock('../../data/incursions', () => import('./incursion-test-mock'))

const INC = TEST_INCURSION

afterEach(() => {
  delete INC.free
})

describe('llaves de incursión', () => {
  it('cuestan lo que marca la dificultad de su incursión', () => {
    for (const inc of INCURSIONS) expect(keyPrice(inc.id)).toBe(KEY_PRICE[inc.tier])
  })

  it('se compran por su precio y se guardan', () => {
    const s = initialState()
    s.money = keyPrice(INC.id)
    expect(buyKey(s, INC.id)).toBe(true)
    expect(keysOf(s, INC.id)).toBe(1)
    expect(s.money).toBe(0)
  })

  it('no se pueden tener más del máximo ni comprar sin ₽', () => {
    const s = initialState()
    s.money = keyPrice(INC.id) - 1
    expect(buyKeyBlocker(s, INC.id)).not.toBeNull()
    s.money = keyPrice(INC.id)
    s.incursionKeys[INC.id] = MAX_KEYS
    expect(buyKey(s, INC.id)).toBe(false)
  })

  it('se gastan de una en una', () => {
    const s = initialState()
    expect(canAffordEntry(s, INC.id)).toBe(false)
    expect(spendKey(s, INC.id)).toBe(false)
    s.incursionKeys[INC.id] = 1
    expect(canAffordEntry(s, INC.id)).toBe(true)
    expect(spendKey(s, INC.id)).toBe(true)
    expect(keysOf(s, INC.id)).toBe(0)
  })

  it('las gratuitas no piden llave ni la venden', () => {
    INC.free = true
    const s = initialState()
    s.money = keyPrice(INC.id)
    expect(canAffordEntry(s, INC.id)).toBe(true)
    expect(spendKey(s, INC.id)).toBe(true)
    expect(buyKey(s, INC.id)).toBe(false)
    expect(keysOf(s, INC.id)).toBe(0)
  })
})

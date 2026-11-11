import { describe, expect, it } from 'vitest'
import { oneOf, weighted } from '../../data/incursions'
import { POKEMON } from '../../data/pokemon'
import { possibleFoes, pickFoe } from './foePool'
import { weakFoe } from './incursion-test-utils'

const a = { ...weakFoe(), speciesId: POKEMON.Caterpie }
const b = { ...weakFoe(), speciesId: POKEMON.Weedle }

describe('rivales al azar', () => {
  it('un rival fijo sale siempre, sin tirar', () => {
    expect(pickFoe(a, () => 0.99)).toBe(a)
    expect(possibleFoes(a)).toEqual([a])
  })

  it('con pesos, cada opción ocupa su parte de la tirada', () => {
    const slot = weighted([a, 3], [b, 1])
    expect(pickFoe(slot, () => 0.74)).toBe(a)
    expect(pickFoe(slot, () => 0.75)).toBe(b)
  })

  it('oneOf reparte igual entre todos', () => {
    const slot = oneOf(a, b)
    expect(pickFoe(slot, () => 0.49)).toBe(a)
    expect(pickFoe(slot, () => 0.5)).toBe(b)
  })

  it('lista todas las opciones de una plaza al azar', () => {
    expect(possibleFoes(oneOf(a, b))).toEqual([a, b])
  })
})

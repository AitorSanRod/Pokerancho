import { describe, expect, it } from 'vitest'
import { SPECIES } from '../../data/species'
import { initialState } from '../core/state'
import { COLLECTION_TIERS, collectionDamage, tierDamage, typeCollection } from './typeCollection'

const TYPE = SPECIES[0].types[0]
const OF_TYPE = SPECIES.filter((sp) => sp.types.includes(TYPE))

describe('colección por tipo', () => {
  it('sin capturas no da daño y el siguiente corte es el primero', () => {
    const c = typeCollection(initialState(), TYPE)
    expect(c).toMatchObject({ caught: 0, total: OF_TYPE.length, damage: 0, next: COLLECTION_TIERS[0] })
    expect(collectionDamage(initialState())).toEqual({})
  })

  it('cada corte da su daño al alcanzarlo, no antes', () => {
    for (const tier of COLLECTION_TIERS) {
      expect(tierDamage(tier.share)).toBe(tier.damage)
      expect(tierDamage(tier.share - 0.001)).toBeLessThan(tier.damage)
    }
  })

  it('con todas las especies del tipo, el daño máximo y ningún corte más', () => {
    const s = initialState()
    s.caught = OF_TYPE.map((sp) => sp.id)
    const best = COLLECTION_TIERS.at(-1)!
    expect(typeCollection(s, TYPE)).toMatchObject({ caught: OF_TYPE.length, damage: best.damage, next: null })
    expect(collectionDamage(s)[TYPE]).toBe(best.damage)
  })
})

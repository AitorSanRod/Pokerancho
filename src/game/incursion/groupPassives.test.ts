import { describe, expect, it } from 'vitest'
import { GROUP_PASSIVE_THRESHOLDS, GROUP_PASSIVES, RARITY_WEIGHT } from '../../data/incursionPassives'
import { Rarity, species } from '../../data/species'
import { speciesOfRarity } from '../core/test-utils'
import { applyGroupPassives, groupPassives, typeWeights } from './groupPassives'
import { ally, HIT } from './incursion-test-utils'

const monOf = (rarity: Rarity, id: string) => ally(id, HIT, speciesOfRarity(rarity))

describe('peso de los tipos del grupo', () => {
  it('cada Pokémon suma el peso de su rareza a cada uno de sus tipos', () => {
    const mon = monOf(Rarity.Epic, 'a')
    const weights = typeWeights([mon])
    for (const t of species(mon.speciesId).types) expect(weights[t]).toBe(RARITY_WEIGHT[Rarity.Epic])
  })

  it('el que ya no vuelve deja de sumar', () => {
    const mon = monOf(Rarity.Rare, 'a')
    mon.out = true
    expect(typeWeights([mon])).toEqual({})
  })
})

describe('pasivas del grupo', () => {
  it('con el peso de cada umbral sube un nivel', () => {
    const type = species(speciesOfRarity(Rarity.Common)).types[0]
    for (const [i, threshold] of GROUP_PASSIVE_THRESHOLDS.entries()) {
      const party = Array.from({ length: threshold }, (_, n) => ally(`m${n}`, HIT, speciesOfRarity(Rarity.Common)))
      expect(groupPassives(party).find((p) => p.type === type)?.level).toBe(i + 1)
    }
  })

  it('valen para todos y los PS actuales se mueven en proporción a los máximos', () => {
    const party = [ally('a'), ally('b')]
    party[0].hp = Math.round(party[0].maxHp / 2)
    const before = party[0].hp / party[0].maxHp
    applyGroupPassives(party, [{ type: 'normal', level: 1 }])
    const gain = GROUP_PASSIVES.normal[0].hp!
    expect(party[1].maxHp).toBe(Math.round(party[1].base.hp * (1 + gain)))
    expect(party[0].hp / party[0].maxHp).toBeCloseTo(before, 1)
  })
})

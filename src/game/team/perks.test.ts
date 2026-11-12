import { describe, expect, it } from 'vitest'
import { POKEMON } from '../../data/pokemon'
import { signatureMove } from '../../data/moves'
import { PokeType } from '../../data/types'
import { makeFighter } from '../battle/battle'
import { damage } from '../battle/attack'
import { seqRng } from '../core/test-utils'
import { initialState } from '../core/state'
import { COLLECTION_TIERS } from '../collection/typeCollection'
import { LEVEL_MILESTONES, levelMilestoneBonus } from './milestones'
import { createMon } from './mons'
import { monPerks, noPerks, parsePerks } from './perks'

const LEVEL = LEVEL_MILESTONES[1]

describe('monPerks', () => {
  it('lleva sus hitos de nivel', () => {
    const s = initialState()
    const mon = createMon(POKEMON.Bulbasaur, LEVEL)
    expect(monPerks(s, mon).stats).toBeCloseTo(levelMilestoneBonus(LEVEL))
  })
})

describe('el bono en combate', () => {
  it('sube las stats del combatiente', () => {
    const plain = makeFighter('player', POKEMON.Bulbasaur, LEVEL)
    const boosted = makeFighter('player', POKEMON.Bulbasaur, LEVEL, { perks: { stats: 0.5, damage: {} } })
    expect(boosted.stats.atk).toBeGreaterThan(plain.stats.atk)
    expect(boosted.maxHp).toBeGreaterThan(plain.maxHp)
  })

  it('sube el daño de los ataques de ese tipo', () => {
    const type = signatureMove(POKEMON.Charmander).type
    const atk = makeFighter('player', POKEMON.Charmander, LEVEL)
    const def = makeFighter('enemy', POKEMON.Bulbasaur, LEVEL)
    const extra = COLLECTION_TIERS.at(-1)!.damage
    const base = damage(atk, def, atk.move, seqRng(0.5)).dealt
    const more = damage({ ...atk, perks: { stats: 0, damage: { [type]: extra } } }, def, atk.move, seqRng(0.5)).dealt
    expect(more).toBeGreaterThan(base)
  })
})

describe('parsePerks', () => {
  it('sin bono (clientes de antes), ninguno', () => {
    expect(parsePerks(undefined)).toEqual(noPerks())
  })

  it('acepta un bono dentro de los topes', () => {
    const perks = { stats: levelMilestoneBonus(LEVEL), damage: { [PokeType.Fire]: COLLECTION_TIERS[0].damage } }
    expect(parsePerks(perks)).toEqual(perks)
  })

  it('rechaza bonos imposibles', () => {
    expect(parsePerks({ stats: 5, damage: {} })).toBeNull()
    expect(parsePerks({ stats: 0, damage: { [PokeType.Fire]: 1 } })).toBeNull()
    expect(parsePerks({ stats: 0, damage: { nope: 0.01 } })).toBeNull()
    expect(parsePerks('x')).toBeNull()
  })
})

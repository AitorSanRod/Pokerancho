import { describe, expect, it } from 'vitest'
import { MoveKind } from '../../data/supportMoves'
import { seqRng } from '../core/test-utils'
import { stat } from './fighter'
import { ally, enemy, field, supportOf } from './incursion-test-utils'
import { AREA_DAMAGE_MULT, performMove } from './moveEffects'

const rng = seqRng(0.5)

describe('movimientos de incursión', () => {
  it('curar va al aliado con menos PS en proporción', () => {
    const heal = supportOf(MoveKind.Heal)
    const healer = ally('h', heal.id)
    const hurt = ally('x')
    hurt.hp = Math.round(hurt.maxHp / 3)
    const { bf } = field([healer, hurt], [enemy('e')])
    const before = hurt.hp
    performMove(bf, healer, rng)
    expect(hurt.hp).toBeGreaterThan(before)
  })

  it('quien provoca se lleva los golpes de los rivales y recibe menos', () => {
    const taunt = supportOf(MoveKind.Taunt)
    const tank = ally('t', taunt.id)
    const other = ally('o')
    const foe = enemy('e')
    const { bf } = field([other, tank], [foe])
    performMove(bf, tank, rng)
    for (let i = 0; i < 5; i++) performMove(bf, foe, seqRng(i / 5))
    expect(other.hp).toBe(other.maxHp)
    expect(tank.hp).toBeLessThan(tank.maxHp)
  })

  it('subir stats lo renueva el mismo movimiento en vez de sumarlo otra vez', () => {
    const boost = supportOf(MoveKind.Boost)
    const a = ally('a', boost.id)
    const b = ally('b', boost.id)
    const { bf } = field([a, b], [enemy('e')])
    const k = boost.changes[0].stat
    performMove(bf, a, rng)
    const once = stat(a, k)
    performMove(bf, b, rng)
    expect(stat(a, k)).toBe(once)
    expect(once).toBeGreaterThan(a.base[k])
  })

  it('bajar stats va al rival con más PS', () => {
    const debuff = { ...supportOf(MoveKind.Debuff), area: false }
    const a = ally('a')
    a.move = debuff
    const small = enemy('s')
    const big = enemy('b', { hpMult: 3 })
    const { bf } = field([a], [small, big])
    performMove(bf, a, rng)
    expect(big.changes.length).toBe(1)
    expect(small.changes.length).toBe(0)
  })

  it('un golpe en área da a todo el grupo con el daño rebajado', () => {
    const party = [ally('a'), ally('b'), ally('c')]
    const foe = enemy('e')
    const single = field([ally('z')], [enemy('f')])
    performMove(single.bf, single.bf.foes[0], seqRng(0.5))
    const fullHit = single.bf.party[0].maxHp - single.bf.party[0].hp
    const { bf } = field(party, [foe])
    performMove(bf, foe, seqRng(0.5), true)
    for (const p of party) expect(p.maxHp - p.hp).toBeLessThanOrEqual(Math.ceil(fullHit * AREA_DAMAGE_MULT) + 1)
    expect(party.every((p) => p.hp < p.maxHp)).toBe(true)
  })
})

import { describe, expect, it } from 'vitest'
import { area, areaAll, drain, healAlly, healTeam, lower, move, raise, raiseSelf, taunt, type IncursionMove } from '../../data/incursionMoves'
import { seqRng } from '../core/test-utils'
import { EventKind } from './events'
import { stat, type GroupFighter } from './fighter'
import { healAmount } from './healing'
import { ally, enemy, field } from './incursion-test-utils'
import { AREA_DAMAGE_MULT, performMove } from './moveEffects'
import { MAX_STAGES } from './statStages'

// Ataques de prueba hechos con el mismo constructor que los de verdad, para no depender de los datos
const POWER = 40
const HEAL_ONE = move('prueba-cura', 'Cura', 'normal', POWER, [healAlly(1)])
const HEAL_ALL = move('prueba-cura-grupo', 'Cura grupo', 'normal', POWER, [healTeam(1)])
const DRAIN = move('prueba-absorber', 'Absorber', 'normal', POWER, [drain(0.5)])
const TAUNT = move('prueba-provocar', 'Provocar', 'normal', 0, [taunt(0.3)])
const RAISE = move('prueba-subir', 'Subir', 'normal', 0, [raise([{ stat: 'atk', stages: 1 }])])
const LOWER = move('prueba-bajar', 'Bajar', 'normal', 0, [lower([{ stat: 'def', stages: -1 }])])
const AREA = move('prueba-avalancha', 'Avalancha', 'normal', POWER, [area()])
const AREA_ALL = move('prueba-terremoto', 'Terremoto', 'normal', POWER, [drain(0.5), areaAll()])

const rng = seqRng(0.5)
const using = (f: GroupFighter, mv: IncursionMove) => Object.assign(f, { move: mv })
const hurtAlly = (id: string) => {
  const f = ally(id)
  f.hp = Math.round(f.maxHp / 3)
  return f
}

describe('ataques de incursión', () => {
  it('uno de cura no pega: convierte su potencia en PS para el aliado con menos PS', () => {
    const healer = using(ally('h'), HEAL_ONE)
    const hurt = hurtAlly('x')
    const foe = enemy('e')
    const { bf } = field([healer, hurt], [foe])
    const before = hurt.hp
    performMove(bf, healer, rng)
    expect(hurt.hp).toBe(Math.min(hurt.maxHp, before + Math.ceil(healAmount(healer, POWER))))
    expect(foe.hp).toBe(foe.maxHp)
  })

  it('uno de cura al grupo cura a todos', () => {
    const healer = using(hurtAlly('h'), HEAL_ALL)
    const other = hurtAlly('x')
    const { bf } = field([healer, other], [enemy('e')])
    const before = [healer.hp, other.hp]
    performMove(bf, healer, rng)
    expect([healer.hp, other.hp].every((hp, i) => hp > before[i])).toBe(true)
  })

  it('uno de daño que cura (como Absorber) pega y recupera la fracción del daño hecho', () => {
    const a = using(hurtAlly('a'), DRAIN)
    const { bf, events } = field([a], [enemy('e', { hpMult: 50 })])
    const before = a.hp
    performMove(bf, a, rng)
    const dealt = events.find((e) => e.kind === EventKind.Hit)!.amount!
    expect(a.hp).toBe(before + Math.ceil(dealt * 0.5))
  })

  it('quien provoca se lleva los golpes de los rivales y recibe menos', () => {
    const tank = using(ally('t'), TAUNT)
    const other = ally('o')
    const foe = enemy('e')
    const { bf } = field([other, tank], [foe])
    performMove(bf, tank, rng)
    for (let i = 0; i < 5; i++) performMove(bf, foe, seqRng(i / 5))
    expect(other.hp).toBe(other.maxHp)
    expect(tank.hp).toBeLessThan(tank.maxHp)
  })

  it('subir stats suma etapas a todo el grupo cada vez, hasta el tope; al tope no hace nada', () => {
    const [a, b] = [using(ally('a'), RAISE), using(ally('b'), RAISE)]
    const { bf, events } = field([a, b], [enemy('e')])
    performMove(bf, a, rng)
    const once = stat(a, 'atk')
    performMove(bf, b, rng)
    expect(stat(a, 'atk')).toBeGreaterThan(once)
    expect(once).toBeGreaterThan(a.base.atk)
    for (let i = 0; i < MAX_STAGES; i++) performMove(bf, a, rng)
    expect(a.stages.atk).toBe(MAX_STAGES)
    expect(stat(a, 'atk')).toBe(a.base.atk * 4)
    expect(events.at(-1)?.text).toContain('no puede subir más')
  })

  it('una subida propia (como Danza Dragón) solo sube al que la usa', () => {
    const dancer = using(ally('d'), move('prueba-danza', 'Danza', 'normal', 0, [raiseSelf([{ stat: 'atk', stages: 1 }])]))
    const other = ally('o')
    const { bf } = field([dancer, other], [enemy('e')])
    performMove(bf, dancer, rng)
    expect(dancer.stages.atk).toBe(1)
    expect(other.stages.atk).toBe(0)
  })

  it('bajar stats a uno va al rival con más PS', () => {
    const a = using(ally('a'), LOWER)
    const small = enemy('s')
    const big = enemy('b', { hpMult: 3 })
    const { bf } = field([a], [small, big])
    performMove(bf, a, rng)
    expect(big.stages.def).toBeLessThan(0)
    expect(small.stages.def).toBe(0)
  })

  it('potenciado por los toques, uno de daño pega más y uno de cura cura más', () => {
    const strikeOn = (boosted: boolean) => {
      const a = ally('a')
      const { bf, events } = field([a], [enemy('e', { hpMult: 50 })])
      if (boosted) bf.boosted = [a.id]
      performMove(bf, a, rng)
      return events.find((e) => e.kind === EventKind.Hit)!
    }
    expect(strikeOn(true).amount).toBeGreaterThan(strikeOn(false).amount!)
    expect(strikeOn(true).potent).toBe(true)
    const healOn = (boosted: boolean) => {
      const healer = using(ally('h'), HEAL_ONE)
      const hurt = hurtAlly('x')
      const { bf } = field([healer, hurt], [enemy('e')])
      if (boosted) bf.boosted = [healer.id]
      performMove(bf, healer, rng)
      return hurt.hp
    }
    expect(healOn(true)).toBeGreaterThan(healOn(false))
  })

  it('un compañero de estado potenciado hace que los demás peguen más', () => {
    const strikeWith = (supportBoosted: boolean) => {
      const a = ally('a')
      const support = using(ally('s'), RAISE)
      const { bf, events } = field([a, support], [enemy('e', { hpMult: 50 })])
      if (supportBoosted) bf.boosted = [support.id]
      performMove(bf, a, rng)
      return events.find((e) => e.kind === EventKind.Hit)!.amount!
    }
    expect(strikeWith(true)).toBeGreaterThan(strikeWith(false))
  })

  it('uno de área da a todos los rivales y no toca a los suyos', () => {
    const user = using(ally('u'), AREA)
    const mate = ally('m')
    const foes = [enemy('e'), enemy('f')]
    const { bf } = field([user, mate], foes)
    performMove(bf, user, rng)
    expect(foes.every((f) => f.hp < f.maxHp)).toBe(true)
    expect(mate.hp).toBe(mate.maxHp)
  })

  it('uno de área que da a todos golpea también a sus compañeros, nunca a sí mismo, y solo drena de los rivales', () => {
    const user = using(hurtAlly('u'), AREA_ALL)
    const mate = ally('m')
    const foe = enemy('e')
    const { bf, events } = field([user, mate], [foe])
    const before = user.hp
    performMove(bf, user, rng)
    expect(foe.hp).toBeLessThan(foe.maxHp)
    expect(mate.hp).toBeLessThan(mate.maxHp)
    const drained = (foe.maxHp - foe.hp) * 0.5
    expect(user.hp - before).toBeLessThanOrEqual(Math.ceil(drained))
    expect(events.some((e) => e.kind === EventKind.Hit && e.target === user.id)).toBe(false)
  })

  it('un golpe en área de un jefe da a todo el grupo con el daño rebajado', () => {
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

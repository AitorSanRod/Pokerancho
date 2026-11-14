import { describe, expect, it } from 'vitest'
import { MAX_STAGES } from '../battle/statStages'
import { seqRng } from '../core/test-utils'
import { EventKind } from './events'
import { ally, enemy, field } from './incursion-test-utils'
import { performMove } from './moveEffects'

// Las pasivas de tipo que actúan al golpear en una incursión: tope de golpe, cura al derrotar y Velocidad al atacar.

const rng = seqRng(0.5)

describe('pasivas al golpear en incursiones', () => {
  it('con tope de golpe, un ataque nunca le quita más de esa parte de sus PS máximos', () => {
    const attacker = ally('a')
    const target = enemy('e', { level: 1 })
    target.bonus.maxHitTaken = 0.1
    const { bf } = field([attacker], [target])
    performMove(bf, attacker, rng)
    expect(target.maxHp - target.hp).toBe(Math.ceil(target.maxHp * 0.1))
  })

  it('al derrotar a un rival, quien da el golpe se cura su parte de los PS máximos', () => {
    const attacker = ally('a')
    attacker.hp = 10
    attacker.bonus.koHeal = 0.25
    const mate = ally('b')
    mate.hp = 10
    mate.bonus.koHeal = 0.25
    const foe = enemy('e', { level: 1 })
    foe.hp = 1
    const { bf } = field([attacker, mate], [foe])
    performMove(bf, attacker, rng)
    expect(foe.hp).toBe(0)
    expect(attacker.hp).toBe(10 + Math.ceil(attacker.maxHp * 0.25))
    expect(mate.hp).toBe(10)
  })

  it('si el rival sigue en pie, no se cura', () => {
    const attacker = ally('a')
    attacker.hp = 10
    attacker.bonus.koHeal = 0.25
    const { bf } = field([attacker], [enemy('e')])
    performMove(bf, attacker, rng)
    expect(attacker.hp).toBe(10)
  })

  it('subiendo Velocidad al atacar, cada movimiento suma etapas hasta el tope, y se anuncia mientras sube', () => {
    const attacker = ally('a')
    attacker.bonus.speedPerAttack = 1
    const foe = enemy('e')
    foe.hp = foe.maxHp = 1e9
    const { bf, events } = field([attacker], [foe])
    performMove(bf, attacker, rng)
    expect(attacker.stages.spe).toBe(1)
    for (let i = 0; i < MAX_STAGES + 2; i++) performMove(bf, attacker, rng)
    expect(attacker.stages.spe).toBe(MAX_STAGES)
    expect(events.filter((e) => e.kind === EventKind.Change && e.target === attacker.id)).toHaveLength(MAX_STAGES)
  })
})

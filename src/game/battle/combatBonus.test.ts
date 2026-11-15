import { describe, expect, it } from 'vitest'
import { StatusId } from '../../data/passives'
import { cappedHit, koHealAmount, sumEffects } from './combatBonus'

describe('pasivas sumadas', () => {
  it('suma los porcentajes, junta los estados y se queda con el tope de daño más bajo', () => {
    const total = sumEffects([
      { atk: 0.1, maxHitTaken: 0.5, inflict: { status: StatusId.Burn, chance: 0.2 } },
      { atk: 0.05, def: 0.1, maxHitTaken: 0.3, inflict: { status: StatusId.Poison, chance: 0.1 } },
    ])
    expect(total.atk).toBeCloseTo(0.15)
    expect(total.def).toBeCloseTo(0.1)
    expect(total.maxHitTaken).toBe(0.3)
    expect(total.inflicts.map((i) => i.status)).toEqual([StatusId.Burn, StatusId.Poison])
  })

  it('reducción de daño, esquiva y crítico nunca deciden solos el combate', () => {
    const total = sumEffects([{ dodge: 0.7, crit: 0.7, damageReduction: 0.7 }, { dodge: 0.7, crit: 0.7, damageReduction: 0.7 }])
    for (const v of [total.dodge, total.crit, total.damageReduction]) expect(v).toBeLessThan(1)
  })

  it('sin pasivas no cambia nada', () => {
    const none = sumEffects([])
    expect(cappedHit(40, none, 100)).toBe(40)
    expect(koHealAmount(none, 100)).toBe(0)
  })

  it('con tope, un golpe no quita más de esa parte de los PS (y al menos 1)', () => {
    const capped = sumEffects([{ maxHitTaken: 0.25 }])
    expect(cappedHit(90, capped, 100)).toBe(25)
    expect(cappedHit(10, capped, 100)).toBe(10)
    expect(cappedHit(5, sumEffects([{ maxHitTaken: 0.001 }]), 100)).toBe(1)
  })
})

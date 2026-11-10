import { describe, expect, it } from 'vitest'
import { Rarity } from '../species'
import { TYPE_INFO, type PokeType } from '../types'
import { area, DAMAGE_BY_TYPE, drain, EffectKind, healAlly, healTeam, IMOVE, incursionMove, isIncursionMove, move, moveClass, MoveClass, raise, SUPPORT_BY_TYPE } from '.'

describe('ataques de incursión', () => {
  it('si cura es de cura; si no, de daño si tiene potencia y de estado si no', () => {
    expect(moveClass(move('a', 'A', 'normal', 20, [healTeam(0.2)]))).toBe(MoveClass.Heal)
    expect(moveClass(move('a', 'A', 'normal', 40, [healAlly(1)]))).toBe(MoveClass.Heal)
    expect(moveClass(move('a', 'A', 'normal', 40, [drain(0.5)]))).toBe(MoveClass.Damage)
    expect(moveClass(move('a', 'A', 'normal', 40, [area()]))).toBe(MoveClass.Damage)
    expect(moveClass(move('a', 'A', 'normal', 0, [raise([{ stat: 'atk', stages: 1 }])]))).toBe(MoveClass.Status)
  })

  it('cada tipo tiene un ataque de daño por rareza y uno de apoyo, y todos existen por su id', () => {
    for (const t of Object.keys(TYPE_INFO) as PokeType[]) {
      for (const r of Object.values(Rarity)) expect(moveClass(DAMAGE_BY_TYPE[t][r])).toBe(MoveClass.Damage)
      expect(moveClass(SUPPORT_BY_TYPE[t].move)).not.toBe(MoveClass.Damage)
    }
    for (const mv of Object.values(IMOVE)) expect(incursionMove(mv.id)).toBe(mv)
    expect(isIncursionMove('no-existe')).toBe(false)
  })

  it('ningún id se repite y todos dicen sus toques y su mejora', () => {
    const all = Object.values(IMOVE)
    expect(new Set(all.map((mv) => mv.id)).size).toBe(all.length)
    for (const mv of all) {
      expect(mv.tapGoal).toBeGreaterThan(0)
      expect(mv.tapBonus).toBeGreaterThan(0)
    }
  })

  it('los de cura llevan potencia', () => {
    for (const mv of Object.values(IMOVE)) if (mv.effects.some((e) => e.kind === EffectKind.HealAlly || e.kind === EffectKind.HealTeam)) expect(mv.power).toBeGreaterThan(0)
  })
})

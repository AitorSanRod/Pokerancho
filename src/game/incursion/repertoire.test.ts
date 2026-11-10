import { describe, expect, it } from 'vitest'
import { DAMAGE_TIER_LEVELS, SPECIES_MOVES } from '../../data/learnsets'
import { Rarity, species, SPECIES } from '../../data/species'
import { DAMAGE_BY_TYPE, MoveClass, moveClass, SUPPORT_BY_TYPE } from '../../data/incursionMoves'
import { speciesOfRarity } from '../core/test-utils'
import { canLearn, learnTimeline, repertoire } from './repertoire'

const MAX_LEVEL = 100
const RARITY_ORDER = Object.values(Rarity)

describe('repertorio de incursión', () => {
  it('todo lo que lleva es de sus tipos o propio de su especie', () => {
    for (const sp of SPECIES) {
      const own = (SPECIES_MOVES[sp.id] ?? []).map((m) => m.moveId)
      for (const mv of repertoire(sp.id, MAX_LEVEL)) expect(sp.types.includes(mv.type) || own.includes(mv.id)).toBe(true)
    }
  })

  it.each(RARITY_ORDER)('un %s lleva, de cada tipo, el ataque de daño del escalón más alto al que llega', (rarity) => {
    const id = speciesOfRarity(rarity)
    const damageAt = (level: number) => repertoire(id, level).filter((mv) => moveClass(mv) === MoveClass.Damage).map((mv) => mv.id)
    expect(damageAt(MAX_LEVEL).sort()).toEqual(species(id).types.map((t) => DAMAGE_BY_TYPE[t][rarity].id).sort())
    expect(damageAt(DAMAGE_TIER_LEVELS[Rarity.Common]).sort()).toEqual(species(id).types.map((t) => DAMAGE_BY_TYPE[t][Rarity.Common].id).sort())
  })

  it('como mucho dos movimientos por tipo, sin contar los propios de su especie', () => {
    for (const sp of SPECIES) {
      const own = new Set((SPECIES_MOVES[sp.id] ?? []).map((m) => m.moveId))
      const byType = repertoire(sp.id, MAX_LEVEL).filter((mv) => !own.has(mv.id))
      for (const t of sp.types) expect(byType.filter((mv) => mv.type === t).length).toBeLessThanOrEqual(2)
    }
  })

  it('cada movimiento se aprende desde su nivel', () => {
    for (const level of Object.values(DAMAGE_TIER_LEVELS)) {
      for (const sp of SPECIES) {
        const own = SPECIES_MOVES[sp.id] ?? []
        for (const mv of repertoire(sp.id, level)) {
          const from = own.find((m) => m.moveId === mv.id)?.level ?? Object.values(SUPPORT_BY_TYPE).find((s) => s.move.id === mv.id)?.level ?? 1
          expect(from).toBeLessThanOrEqual(level)
        }
      }
    }
  })

  it('no repite movimientos', () => {
    for (const sp of SPECIES) {
      const ids = repertoire(sp.id, MAX_LEVEL).map((mv) => mv.id)
      expect(new Set(ids).size).toBe(ids.length)
    }
  })

  it('canLearn dice si un movimiento está en su repertorio', () => {
    const id = speciesOfRarity(Rarity.Common)
    const [first] = repertoire(id, MAX_LEVEL)
    expect(canLearn(id, MAX_LEVEL, first.id)).toBe(true)
    expect(canLearn(id, MAX_LEVEL, 'no-existe')).toBe(false)
  })

  it('learnTimeline dice desde qué nivel lleva cada movimiento y hasta cuándo', () => {
    for (const sp of SPECIES) {
      const steps = learnTimeline(sp.id)
      for (const level of [1, ...Object.values(DAMAGE_TIER_LEVELS), MAX_LEVEL]) {
        const held = steps.filter((st) => st.from <= level && (st.until === null || st.until >= level)).map((st) => st.move.id)
        expect(held.sort()).toEqual(repertoire(sp.id, level).map((mv) => mv.id).sort())
      }
    }
  })
})

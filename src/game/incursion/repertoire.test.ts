import { describe, expect, it } from 'vitest'
import { DAMAGE_TIER_LEVELS, SPECIES_MOVES } from '../../data/learnsets'
import { typeMove } from '../../data/moves'
import { Rarity, species, SPECIES } from '../../data/species'
import { MoveKind } from '../../data/supportMoves'
import { speciesOfRarity } from '../core/test-utils'
import { canLearn, repertoire } from './repertoire'

const MAX_LEVEL = 100
const RARITY_ORDER = Object.values(Rarity)

describe('repertorio de incursión', () => {
  it('todo lo que lleva es de sus tipos o propio de su especie', () => {
    for (const sp of SPECIES) {
      const own = (SPECIES_MOVES[sp.id] ?? []).map((m) => m.moveId)
      for (const mv of repertoire(sp.id, MAX_LEVEL)) expect(sp.types.includes(mv.type) || own.includes(mv.id)).toBe(true)
    }
  })

  it.each(RARITY_ORDER)('un %s tiene los ataques de daño de sus tipos hasta su escalón, no más', (rarity) => {
    const id = speciesOfRarity(rarity)
    const allowed = RARITY_ORDER.slice(0, RARITY_ORDER.indexOf(rarity) + 1)
    const expected = species(id).types.flatMap((t) => allowed.map((r) => typeMove(t, r).id))
    const damage = repertoire(id, MAX_LEVEL).filter((mv) => mv.kind === MoveKind.Damage).map((mv) => mv.id)
    expect(damage.sort()).toEqual(expected.sort())
  })

  it('cada movimiento se aprende desde su nivel', () => {
    for (const level of Object.values(DAMAGE_TIER_LEVELS)) {
      for (const sp of SPECIES) {
        const own = SPECIES_MOVES[sp.id] ?? []
        for (const mv of repertoire(sp.id, level)) {
          const from = own.find((m) => m.moveId === mv.id)?.level ?? (mv.kind === MoveKind.Damage ? 1 : mv.level)
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
})

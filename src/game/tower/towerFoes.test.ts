import { describe, expect, it } from 'vitest'
import { SPECIES } from '../../data/species'
import { initialState } from '../core/state'
import { seqRng } from '../core/test-utils'
import { MAX_LEVEL } from '../team/stats'
import { TOWER_LEVEL_CAP_FLOOR, TOWER_STAT_MULT, towerFoe, towerLevel, towerStatMult } from './towerFoes'

const ROLLS = [0, 0.25, 0.5, 0.75, 0.99]

describe('rivales de la torre', () => {
  it('suben de nivel piso a piso hasta el máximo', () => {
    expect(towerLevel(1)).toBeLessThan(towerLevel(2))
    expect(towerLevel(TOWER_LEVEL_CAP_FLOOR)).toBe(MAX_LEVEL)
    expect(towerLevel(TOWER_LEVEL_CAP_FLOOR + 10)).toBe(MAX_LEVEL)
  })

  it('sus stats solo suben pasado el último piso de nivel, y poco a poco', () => {
    expect(towerStatMult(1)).toBe(TOWER_STAT_MULT)
    expect(towerStatMult(TOWER_LEVEL_CAP_FLOOR)).toBe(TOWER_STAT_MULT)
    const next = towerStatMult(TOWER_LEVEL_CAP_FLOOR + 1)
    expect(next).toBeGreaterThan(TOWER_STAT_MULT)
    expect(towerStatMult(TOWER_LEVEL_CAP_FLOOR + 2)).toBeGreaterThan(next)
  })

  it('hasta el último piso de nivel solo salen especies vistas', () => {
    const s = initialState()
    s.seen = [SPECIES[3].id, SPECIES[7].id]
    for (const r of ROLLS) expect(s.seen).toContain(towerFoe(s, TOWER_LEVEL_CAP_FLOOR, seqRng(r)))
  })

  it('después sale cualquiera y no se apunta como vista', () => {
    const s = initialState()
    s.seen = [SPECIES[3].id]
    const foes = ROLLS.flatMap((a) => ROLLS.map((b) => towerFoe(s, TOWER_LEVEL_CAP_FLOOR + 1, seqRng(a, b))))
    expect(foes.some((id) => !s.seen.includes(id))).toBe(true)
    expect(s.seen).toEqual([SPECIES[3].id])
  })
})

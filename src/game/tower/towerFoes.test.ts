import { describe, expect, it } from 'vitest'
import { baseStatTotal, Rarity, rarityOf, SPECIES, species } from '../../data/species'
import { TOWER_CUTS } from '../../data/towerCuts'
import { initialState } from '../core/state'
import { seqRng } from '../core/test-utils'
import { MAX_LEVEL } from '../team/stats'
import { TOWER_LEVEL_CAP_FLOOR, TOWER_STAT_MULT, towerFoe, towerLevel, towerMinPower, towerStatMult } from './towerFoes'

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

  it('los cortes de poder solo suben piso a piso', () => {
    let last = 0
    for (const cut of TOWER_CUTS) {
      expect(towerMinPower(cut.fromFloor - 1)).toBe(last)
      expect(towerMinPower(cut.fromFloor)).toBeGreaterThanOrEqual(last)
      last = towerMinPower(cut.fromFloor)
    }
  })

  it('el último corte no deja solo legendarios', () => {
    const top = towerMinPower(Number.MAX_SAFE_INTEGER)
    expect(SPECIES.some((sp) => baseStatTotal(sp) >= top && rarityOf(sp) !== Rarity.Legendary)).toBe(true)
  })

  it('con corte, las especies vistas más débiles no salen', () => {
    const cut = TOWER_CUTS.find((c) => c.fromFloor <= TOWER_LEVEL_CAP_FLOOR)!
    const weak = SPECIES.find((sp) => baseStatTotal(sp) < cut.minPower)!
    const strong = SPECIES.find((sp) => baseStatTotal(sp) >= cut.minPower)!
    const s = initialState()
    s.seen = [weak.id, strong.id]
    for (const r of ROLLS) expect(towerFoe(s, cut.fromFloor, seqRng(r))).toBe(strong.id)
    expect(towerFoe(s, cut.fromFloor - 1, seqRng(0))).toBe(weak.id)
  })

  it('si no ha visto ninguna que llegue al corte, sale otra que llegue', () => {
    const cut = TOWER_CUTS.find((c) => c.fromFloor <= TOWER_LEVEL_CAP_FLOOR)!
    const s = initialState()
    s.seen = [SPECIES.find((sp) => baseStatTotal(sp) < cut.minPower)!.id]
    for (const r of ROLLS) expect(baseStatTotal(species(towerFoe(s, cut.fromFloor, seqRng(r))))).toBeGreaterThanOrEqual(cut.minPower)
  })

  it('pasado el último piso de nivel, los rivales también respetan el corte', () => {
    const floor = Math.max(TOWER_LEVEL_CAP_FLOOR + 1, ...TOWER_CUTS.map((c) => c.fromFloor))
    const s = initialState()
    for (const a of ROLLS) for (const b of ROLLS) {
      expect(baseStatTotal(species(towerFoe(s, floor, seqRng(a, b))))).toBeGreaterThanOrEqual(towerMinPower(floor))
    }
  })
})

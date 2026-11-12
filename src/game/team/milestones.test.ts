import { describe, expect, it } from 'vitest'
import { SPECIES, species } from '../../data/species'
import { initialState } from '../core/state'
import { createMon } from './mons'
import {
  fiveStarCountByType,
  fiveStarSpecies,
  LEVEL_MILESTONES,
  levelMilestoneBonus,
  MILESTONE_STAT_BONUS,
  reachedMilestones,
  STAR_TYPE_BONUS,
  STAR_TYPE_BONUS_MAX,
  starTypeBonuses,
} from './milestones'
import { MAX_STARS } from './stats'

const withStars = (speciesId: number, stars: number) => ({ ...createMon(speciesId, 5), stars })

describe('hitos de nivel', () => {
  it('por debajo del primer hito no suma nada', () => {
    expect(levelMilestoneBonus(LEVEL_MILESTONES[0] - 1)).toBe(0)
  })

  it('cada hito alcanzado suma su parte', () => {
    LEVEL_MILESTONES.forEach((level, i) => {
      expect(reachedMilestones(level)).toHaveLength(i + 1)
      expect(levelMilestoneBonus(level)).toBeCloseTo((i + 1) * MILESTONE_STAT_BONUS)
    })
  })
})

describe('bono de 5 ★ por tipo', () => {
  it('solo cuentan los Pokémon con todas las ★, una vez por especie', () => {
    const s = initialState()
    const id = SPECIES[0].id
    s.owned.push(withStars(id, MAX_STARS), withStars(id, MAX_STARS), withStars(SPECIES[1].id, MAX_STARS - 1))
    expect(fiveStarSpecies(s)).toEqual([id])
    for (const t of species(id).types) expect(starTypeBonuses(s)[t]).toBeCloseTo(STAR_TYPE_BONUS)
  })

  it('se suma por especie hasta el tope de cada tipo', () => {
    const s = initialState()
    const type = SPECIES[0].types[0]
    const ofType = SPECIES.filter((sp) => sp.types.includes(type))
    for (const sp of ofType) s.owned.push(withStars(sp.id, MAX_STARS))
    const expected = Math.min(STAR_TYPE_BONUS_MAX, ofType.length * STAR_TYPE_BONUS)
    expect(starTypeBonuses(s)[type]).toBeCloseTo(expected)
  })

  it('cuenta las especies con 5 ★ de cada tipo, sin tope', () => {
    const s = initialState()
    const type = SPECIES[0].types[0]
    const ofType = SPECIES.filter((sp) => sp.types.includes(type))
    for (const sp of ofType) s.owned.push(withStars(sp.id, MAX_STARS))
    expect(fiveStarCountByType(s)[type]).toBe(ofType.length)
  })
})

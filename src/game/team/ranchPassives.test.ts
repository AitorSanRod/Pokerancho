import { describe, expect, it } from 'vitest'
import { RouteId } from '../../data/maps'
import { PASSIVE_THRESHOLDS } from '../../data/passives'
import { RANCH_TYPE_IDS, RANCH_TYPE_THRESHOLD_DISCOUNT, RANCH_TYPES } from '../../data/ranchTypes'
import { Rarity, RARITY_INFO, rarityOf, SPECIES } from '../../data/species'
import type { PokeType } from '../../data/types'
import { initialState } from '../core/state'
import { chooseStarter } from '../core/test-utils'
import { createMon, NEW_MON_LEVEL } from './mons'
import { maxesPassives, passiveThreshold, passiveWeightOf, ranchPassives, ranchTypeCounts } from './ranchPassives'
import { buyRanchType, placeRanchType } from './ranchTypes'

const isCommon = (sp: (typeof SPECIES)[number]) => rarityOf(sp) === Rarity.Common
/** Especie común de un solo tipo, para que cada Pokémon sume exactamente 1 a ese tipo */
const pureOf = (type: PokeType) => SPECIES.find((sp) => isCommon(sp) && sp.types.length === 1 && sp.types[0] === type)!.id
const DUAL = SPECIES.find((sp) => isCommon(sp) && sp.types.length === 2)!
/** Una especie de un solo tipo para cada rareza que no es legendaria */
const PURE_BY_RARITY = [Rarity.Common, Rarity.Rare, Rarity.Epic].map((r) => SPECIES.find((sp) => rarityOf(sp) === r && sp.types.length === 1)!)
const [LEVEL_1, LEVEL_2] = PASSIVE_THRESHOLDS

/** Rancho 0 con `count` Pokémon de un solo tipo (el primero es el activo) */
function ranchWith(type: PokeType, count: number) {
  const s = initialState()
  chooseStarter(s, pureOf(type))
  for (let i = 1; i < count; i++) s.owned.push(createMon(pureOf(type), NEW_MON_LEVEL))
  s.money = 1e9
  return s
}

describe('ranchTypeCounts', () => {
  it('los de dos tipos suman a ambos', () => {
    const s = initialState()
    chooseStarter(s, DUAL.id)
    expect(ranchTypeCounts(s, 0)).toEqual({ [DUAL.types[0]]: 1, [DUAL.types[1]]: 1 })
  })

  it('cuentan todos los del rancho, también el activo y los que están de expedición, y no los de otros ranchos', () => {
    const s = ranchWith('normal', 3)
    s.expeditions.push({ uid: s.owned[1].uid, routeId: RouteId.PuebloPaleta, durationMin: 15, elapsedMin: 0 })
    s.owned.push(createMon(pureOf('normal'), NEW_MON_LEVEL, 1))
    expect(ranchTypeCounts(s, 0).normal).toBe(3)
  })

  it('cada uno cuenta lo de su rareza', () => {
    for (const sp of PURE_BY_RARITY) {
      const s = initialState()
      chooseStarter(s, sp.id)
      expect(passiveWeightOf(sp.id)).toBe(RARITY_INFO[rarityOf(sp)].passiveWeight)
      expect(ranchTypeCounts(s, 0)[sp.types[0]]).toBe(passiveWeightOf(sp.id))
    }
  })
})

describe('ranchPassives', () => {
  it(`con ${LEVEL_1} del mismo tipo da el nivel 1 y con ${LEVEL_2}, el nivel 2`, () => {
    expect(ranchPassives(ranchWith('fire', LEVEL_1 - 1), 0)).toEqual([])
    expect(ranchPassives(ranchWith('fire', LEVEL_1), 0)).toEqual([{ type: 'fire', level: 1 }])
    expect(ranchPassives(ranchWith('fire', LEVEL_2), 0)).toEqual([{ type: 'fire', level: 2 }])
  })

  it('un tipo de rancho que favorece al tipo rebaja los umbrales', () => {
    const id = RANCH_TYPE_IDS.find((r) => RANCH_TYPES[r].favors.includes('water'))!
    const s = ranchWith('water', LEVEL_1 - RANCH_TYPE_THRESHOLD_DISCOUNT)
    expect(ranchPassives(s, 0)).toEqual([])
    buyRanchType(s, id)
    placeRanchType(s, 0, id)
    expect(passiveThreshold(s, 0, 'water', 2)).toBe(LEVEL_2 - RANCH_TYPE_THRESHOLD_DISCOUNT)
    expect(ranchPassives(s, 0)).toEqual([{ type: 'water', level: 1 }])
  })

  it('un legendario sube él solo la pasiva de sus tipos al nivel máximo, y no las de otros tipos', () => {
    const legendary = SPECIES.find((sp) => maxesPassives(sp.id))!
    const other = (['normal', 'fire', 'water', 'grass'] as PokeType[]).find((t) => !legendary.types.includes(t))!
    const s = ranchWith(other, 1)
    s.owned.push(createMon(legendary.id, NEW_MON_LEVEL))
    expect(ranchPassives(s, 0)).toEqual(legendary.types.map((type) => ({ type, level: 2 })))
    expect(ranchPassives(s, 1)).toEqual([])
  })

  it('el tipo de rancho no rebaja los tipos que no favorece', () => {
    const id = RANCH_TYPE_IDS.find((r) => !RANCH_TYPES[r].favors.includes('fire'))!
    const s = ranchWith('fire', 1)
    buyRanchType(s, id)
    placeRanchType(s, 0, id)
    expect(passiveThreshold(s, 0, 'fire', 1)).toBe(LEVEL_1)
  })
})

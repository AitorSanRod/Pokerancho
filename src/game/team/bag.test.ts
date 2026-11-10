import { describe, expect, it } from 'vitest'
import { FORM_ITEM_IDS } from '../../data/forms'
import { INCURSIONS } from '../../data/incursions'
import { RANCH_TYPE_IDS } from '../../data/ranchTypes'
import { STAR_ITEM_IDS } from '../../data/starItems'
import { TM_IDS } from '../../data/tms'
import { STONE_IDS } from '../../data/stones'
import { initialState } from '../core/state'
import { bagContents, isBagEmpty } from './bag'

const STONE = STONE_IDS[0]
const RANCH_TYPE = RANCH_TYPE_IDS[0]

describe('mochila', () => {
  it('empieza vacía', () => {
    expect(isBagEmpty(bagContents(initialState()))).toBe(true)
  })

  it('guarda las piedras sin gastar', () => {
    const s = initialState()
    s.stones[STONE] = 2
    expect(bagContents(s).stones).toEqual([{ id: STONE, count: 2 }])
  })

  it('guarda los objetos de forma, uno de cada', () => {
    const s = initialState()
    s.formItems.push(FORM_ITEM_IDS[0])
    expect(bagContents(s).formItems).toEqual([{ id: FORM_ITEM_IDS[0], count: 1 }])
  })

  it('solo cuenta los tipos de rancho que no están colocados', () => {
    const s = initialState()
    s.ranchTypeItems[RANCH_TYPE] = 2
    s.ranchTypeOf[0] = RANCH_TYPE
    expect(bagContents(s).ranchTypes).toEqual([{ id: RANCH_TYPE, count: 1 }])
    s.ranchTypeItems[RANCH_TYPE] = 1
    expect(isBagEmpty(bagContents(s))).toBe(true)
  })

  it('guarda las llaves de incursión sin gastar', () => {
    const s = initialState()
    const id = INCURSIONS[0].id
    s.incursionKeys[id] = 3
    expect(bagContents(s).incursionKeys).toEqual([{ id, count: 3 }])
    expect(isBagEmpty(bagContents(s))).toBe(false)
  })

  it('guarda las MTs sin usar', () => {
    const s = initialState()
    const [id] = TM_IDS
    s.tms[id] = 1
    expect(bagContents(s).tms).toEqual([{ id, count: 1 }])
    expect(isBagEmpty(bagContents(s))).toBe(false)
  })

  it('guarda los objetos estelares sin gastar', () => {
    const s = initialState()
    const id = STAR_ITEM_IDS[0]
    s.starItems[id] = 2
    expect(bagContents(s).starItems).toEqual([{ id, count: 2 }])
  })
})

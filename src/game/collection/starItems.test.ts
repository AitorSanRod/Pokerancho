import { describe, expect, it } from 'vitest'
import { Rarity } from '../../data/species'
import { STAR_ITEM_IDS, STAR_ITEMS, starItemOfRarity, type StarItem } from '../../data/starItems'
import { initialState } from '../core/state'
import { seqRng, speciesOfRarity } from '../core/test-utils'
import { PIECES_PER_PULL, pull } from './gacha'
import { addStarItems, pullsToPity, pullsWithout, rollStarItem, spendStarItem, starItemBlocker, starItemFor, starItemsOf } from './starItems'

const NEVER = seqRng(0.999999)
const WITH_PITY = STAR_ITEM_IDS.filter((id) => STAR_ITEMS[id].pity !== null)
/** El objeto con garantía que menos tiradas necesita */
const SOONEST = WITH_PITY.reduce((a, b) => (STAR_ITEMS[a].pity! <= STAR_ITEMS[b].pity! ? a : b))

/** Probabilidad acumulada hasta `item` (incluido), en el orden en que se sortean */
const upTo = (item: StarItem) => STAR_ITEM_IDS.slice(0, STAR_ITEM_IDS.indexOf(item) + 1).reduce((sum, id) => sum + STAR_ITEMS[id].gachaChance, 0)

describe('objetos estelares', () => {
  it('los comunes no piden ninguno; el resto, el de su rareza', () => {
    expect(starItemFor(speciesOfRarity(Rarity.Common))).toBeNull()
    for (const rarity of [Rarity.Rare, Rarity.Epic, Rarity.Legendary]) {
      expect(starItemFor(speciesOfRarity(rarity))).toBe(starItemOfRarity(rarity))
      expect(starItemOfRarity(rarity)).not.toBeNull()
    }
  })

  it('se suman, se gastan y bloquean si faltan', () => {
    const s = initialState()
    const id = speciesOfRarity(Rarity.Rare)
    const item = starItemFor(id)!
    expect(starItemBlocker(s, id)).toMatch(STAR_ITEMS[item].name)
    expect(spendStarItem(s, item)).toBe(false)
    addStarItems(s, item, 2)
    expect(starItemBlocker(s, id)).toBeNull()
    expect(spendStarItem(s, item)).toBe(true)
    expect(starItemsOf(s, item)).toBe(1)
  })
})

describe('rollStarItem', () => {
  it('cada objeto sale por debajo de su probabilidad acumulada y no por encima', () => {
    for (const item of STAR_ITEM_IDS) {
      const s = initialState()
      expect(rollStarItem(s, seqRng(upTo(item) - 1e-9))).toBe(item)
      expect(starItemsOf(s, item)).toBe(1)
    }
    expect(rollStarItem(initialState(), seqRng(upTo(STAR_ITEM_IDS.at(-1)!)))).toBeNull()
  })

  it('cuenta las tiradas sin salir y da el objeto seguro en la última de su garantía', () => {
    const s = initialState()
    const pity = STAR_ITEMS[SOONEST].pity!
    for (let i = 1; i < pity; i++) expect(rollStarItem(s, NEVER)).toBeNull()
    expect(pullsToPity(s, SOONEST)).toBe(1)
    expect(rollStarItem(s, NEVER)).toBe(SOONEST)
    expect(pullsWithout(s, SOONEST)).toBe(0)
  })

  it('la garantía de un objeto vuelve a empezar cuando sale por suerte, sin tocar las demás', () => {
    const s = initialState()
    rollStarItem(s, NEVER)
    rollStarItem(s, seqRng(upTo(SOONEST) - 1e-9))
    expect(pullsWithout(s, SOONEST)).toBe(0)
    for (const id of WITH_PITY) if (id !== SOONEST) expect(pullsWithout(s, id)).toBe(2)
  })

  it('si coinciden varias garantías sale la del objeto más valioso y la otra espera a la siguiente tirada', () => {
    const s = initialState()
    for (const id of WITH_PITY) s.gachaPity[id] = STAR_ITEMS[id].pity! - 1
    expect(rollStarItem(s, NEVER)).toBe(WITH_PITY[0])
    expect(rollStarItem(s, NEVER)).toBe(WITH_PITY[1])
  })

  it('los objetos sin garantía no cuentan tiradas', () => {
    const s = initialState()
    rollStarItem(s, NEVER)
    for (const id of STAR_ITEM_IDS) if (STAR_ITEMS[id].pity === null) expect(pullsToPity(s, id)).toBeNull()
    expect(Object.keys(s.gachaPity).sort()).toEqual([...WITH_PITY].sort())
  })
})

describe('pull con objeto estelar', () => {
  it('el objeto ocupa una de las casillas de la tirada', () => {
    const s = initialState()
    s.tickets = 1
    // Sin dinero, el objeto más valioso y piezas comunes
    const result = pull(s, 1, seqRng(0.999999, 0, ...Array<number>(2 * PIECES_PER_PULL).fill(0.999999)))
    expect(result.starItems).toEqual([STAR_ITEM_IDS[0]])
    expect(result.pieces).toHaveLength(PIECES_PER_PULL - 1)
    expect(starItemsOf(s, STAR_ITEM_IDS[0])).toBe(1)
  })
})

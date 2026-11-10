import { describe, expect, it } from 'vitest'
import { FORM_ITEM_IDS, FORM_ITEMS } from '../../data/forms'
import { RouteId } from '../../data/maps'
import { baseSpeciesOf, SPECIES } from '../../data/species'
import { combineKind, CombineKind } from '../collection/pieces'
import { isFavorite, toggleFavorite } from '../collection/dex'
import { initialState, ownedOfSpecies, type GameState } from '../core/state'
import { tradedMon } from '../trade/tradeGive'
import { buyFormItem, buyFormItemBlocker, changeForm, changeFormBlocker, formChoices, hasFormItem } from './forms'
import { createMon } from './mons'
import { maxHp } from './stats'

const ITEM = FORM_ITEM_IDS[0]
const FORM = FORM_ITEMS[ITEM].formId
const BASE = baseSpeciesOf(FORM)
const OTHER_ITEM = FORM_ITEM_IDS.find((id) => baseSpeciesOf(FORM_ITEMS[id].formId) === BASE && id !== ITEM)!
const LEVEL = 20

function withMon(): { s: GameState; uid: string } {
  const s = initialState()
  const mon = createMon(BASE, LEVEL)
  s.owned.push(mon)
  return { s, uid: mon.uid }
}

describe('objetos de forma', () => {
  it('se compran una sola vez por su precio', () => {
    const s = initialState()
    s.money = FORM_ITEMS[ITEM].price * 2
    expect(buyFormItem(s, ITEM)).toBe(true)
    expect(hasFormItem(s, ITEM)).toBe(true)
    expect(buyFormItemBlocker(s, ITEM)).not.toBeNull()
    expect(buyFormItem(s, ITEM)).toBe(false)
    expect(s.money).toBe(FORM_ITEMS[ITEM].price)
  })

  it('sin ₽ suficientes no se compran', () => {
    const s = initialState()
    s.money = FORM_ITEMS[ITEM].price - 1
    expect(buyFormItem(s, ITEM)).toBe(false)
    expect(s.formItems).toEqual([])
  })
})

describe('cambio de forma', () => {
  it('la especie con formas puede ir a la normal y a la de cada objeto; la que no tiene, a ninguna', () => {
    const choices = formChoices(BASE).map((c) => c.speciesId)
    expect(choices[0]).toBe(BASE)
    expect(choices).toContain(FORM)
    expect(formChoices(FORM)).toEqual(formChoices(BASE))
    const plain = SPECIES.find((sp) => formChoices(sp.id).length === 0)!
    expect(formChoices(plain.id)).toEqual([])
  })

  it('sin el objeto no cambia; con él, cambia gratis las veces que quiera, y vuelve a la normal', () => {
    const { s, uid } = withMon()
    expect(changeFormBlocker(s, uid, FORM)).not.toBeNull()
    s.formItems.push(ITEM, OTHER_ITEM)
    const money = s.money
    expect(changeForm(s, uid, FORM)).toBe(true)
    expect(ownedOfSpecies(s, BASE)!.speciesId).toBe(FORM)
    expect(changeForm(s, uid, FORM_ITEMS[OTHER_ITEM].formId)).toBe(true)
    expect(changeForm(s, uid, BASE)).toBe(true)
    expect(changeForm(s, uid, FORM)).toBe(true)
    expect(s.formItems).toEqual([ITEM, OTHER_ITEM])
    expect(s.money).toBe(money)
  })

  it('conserva nivel, EXP, ★ y la fracción de PS', () => {
    const { s, uid } = withMon()
    s.formItems.push(ITEM)
    const mon = s.owned[0]
    Object.assign(mon, { exp: 7, stars: 2 })
    mon.hp = Math.round(maxHp(mon) / 2)
    const fraction = mon.hp / maxHp(mon)
    changeForm(s, uid, FORM)
    expect(mon).toMatchObject({ level: LEVEL, exp: 7, stars: 2 })
    expect(mon.hp / maxHp(mon)).toBeCloseTo(fraction, 1)
  })

  it('no cambia fuera del rancho ni de la Caja, ni a una forma de otra especie', () => {
    const { s, uid } = withMon()
    s.formItems.push(ITEM)
    s.expeditions.push({ uid, routeId: RouteId.PuebloPaleta, durationMin: 15, elapsedMin: 0 })
    expect(changeForm(s, uid, FORM)).toBe(false)
    const other = createMon(SPECIES.find((sp) => formChoices(sp.id).length === 0)!.id, LEVEL)
    s.owned.push(other)
    expect(changeForm(s, other.uid, FORM)).toBe(false)
  })

  it('en otra forma sigue contando como su especie: tickets, favorito e intercambio', () => {
    const { s, uid } = withMon()
    s.formItems.push(ITEM)
    changeForm(s, uid, FORM)
    expect(combineKind(s, BASE)).toBe(CombineKind.Star)
    s.seen.push(BASE)
    toggleFavorite(s, BASE)
    expect(isFavorite(s, FORM)).toBe(true)
    expect(tradedMon(s.owned[0]).speciesId).toBe(BASE)
  })
})

import { FORM_ITEMS, formItemsOf, type FormItem } from '../../data/forms'
import { baseSpeciesOf, species } from '../../data/species'
import { findMon, MonPlace, monPlace, type GameState } from '../core/state'
import { maxHp } from './stats'

// Cambio de forma desde la ficha (Rotom → Rotom Calor…): con el objeto de la forma en la Mochila, gratis y las veces que
// se quiera, también de vuelta a la forma normal. Es el mismo Pokémon con otra especie: conserva nivel, EXP, ★ y la
// fracción de PS que tenía.

export const hasFormItem = (s: GameState, id: FormItem): boolean => s.formItems.includes(id)

/** Por qué no se puede comprar (null si se puede): se compra una sola vez */
export function buyFormItemBlocker(s: GameState, id: FormItem): string | null {
  if (hasFormItem(s, id)) return 'Ya lo tienes.'
  return s.money < FORM_ITEMS[id].price ? `Necesitas ₽ ${FORM_ITEMS[id].price}.` : null
}

/** Compra el objeto de forma; false si ya lo tiene o no hay ₽ */
export function buyFormItem(s: GameState, id: FormItem): boolean {
  if (buyFormItemBlocker(s, id)) return false
  s.money -= FORM_ITEMS[id].price
  s.formItems.push(id)
  return true
}

/** Formas a las que puede pasar la especie: la normal y la de cada uno de sus objetos (vacío si no tiene formas) */
export function formChoices(speciesId: number): { speciesId: number; item: FormItem | null }[] {
  const items = formItemsOf(speciesId)
  if (items.length === 0) return []
  return [{ speciesId: baseSpeciesOf(speciesId), item: null }, ...items.map((item) => ({ speciesId: FORM_ITEMS[item].formId, item }))]
}

/** Por qué no puede cambiar a la forma `intoId` (null si puede) */
export function changeFormBlocker(s: GameState, uid: string, intoId: number): string | null {
  const mon = findMon(s, uid)
  if (!mon) return 'Ese Pokémon no existe.'
  const choice = formChoices(mon.speciesId).find((c) => c.speciesId === intoId)
  if (!choice) return `${species(mon.speciesId).name} no puede pasar a ${species(intoId).name}.`
  if (mon.speciesId === intoId) return `Ya es ${species(intoId).name}.`
  const place = monPlace(s, uid)
  if (place !== MonPlace.Ranch && place !== MonPlace.Box) return 'Solo puede cambiar de forma en el rancho o en la Caja.'
  if (choice.item && !hasFormItem(s, choice.item)) return `Falta el objeto ${FORM_ITEMS[choice.item].name}.`
  return null
}

/** Cambia de forma; false si no puede */
export function changeForm(s: GameState, uid: string, intoId: number): boolean {
  if (changeFormBlocker(s, uid, intoId)) return false
  const mon = findMon(s, uid)!
  const hpFraction = mon.hp / maxHp(mon)
  mon.speciesId = intoId
  mon.hp = Math.min(maxHp(mon), Math.max(mon.hp > 0 ? 1 : 0, Math.round(hpFraction * maxHp(mon))))
  return true
}

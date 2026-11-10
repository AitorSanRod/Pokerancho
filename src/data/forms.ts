import { POKEMON_FORM } from './pokemon'
import { baseSpeciesOf } from './species'

/** Objetos que cambian de forma a un Pokémon: se compran una vez y, desde la Mochila, se usan siempre que se quiera */
export const FormItem = {
  Microwave: 'microwave',
  WashingMachine: 'washing-machine',
  Fridge: 'fridge',
  Fan: 'fan',
  Mower: 'mower',
} as const
export type FormItem = (typeof FormItem)[keyof typeof FormItem]

/** ₽ que cuesta cada objeto de forma de Rotom en la tienda (se compra una sola vez) */
const ROTOM_FORM_ITEM_PRICE = 50_000

interface FormItemInfo {
  name: string
  /** La forma a la que lleva; su icono es el sprite de esa forma */
  formId: number
  /** ₽ que cuesta en la tienda */
  price: number
}

export const FORM_ITEMS: Record<FormItem, FormItemInfo> = {
  [FormItem.Microwave]: { name: 'Microondas', formId: POKEMON_FORM.RotomHeat, price: ROTOM_FORM_ITEM_PRICE },
  [FormItem.WashingMachine]: { name: 'Lavadora', formId: POKEMON_FORM.RotomWash, price: ROTOM_FORM_ITEM_PRICE },
  [FormItem.Fridge]: { name: 'Frigorífico', formId: POKEMON_FORM.RotomFrost, price: ROTOM_FORM_ITEM_PRICE },
  [FormItem.Fan]: { name: 'Ventilador', formId: POKEMON_FORM.RotomFan, price: ROTOM_FORM_ITEM_PRICE },
  [FormItem.Mower]: { name: 'Cortacésped', formId: POKEMON_FORM.RotomMow, price: ROTOM_FORM_ITEM_PRICE },
}

export const FORM_ITEM_IDS = Object.keys(FORM_ITEMS) as FormItem[]

export const isFormItem = (v: unknown): v is FormItem => FORM_ITEM_IDS.includes(v as FormItem)

/** Objetos que cambian de forma a esta especie (o a cualquiera de sus formas); vacío si no tiene formas */
export const formItemsOf = (speciesId: number): FormItem[] =>
  FORM_ITEM_IDS.filter((id) => baseSpeciesOf(FORM_ITEMS[id].formId) === baseSpeciesOf(speciesId))

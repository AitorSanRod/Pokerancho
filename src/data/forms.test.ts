import { describe, expect, it } from 'vitest'
import { FORM_ITEM_IDS, FORM_ITEMS, formItemsOf } from './forms'
import { POKEMON_FORM } from './pokemon'
import { baseSpeciesOf, FORM_SPECIES, isKnownSpecies, rarityOf, species, SPECIES } from './species'

describe('formas', () => {
  it('POKEMON_FORM tiene una clave por forma de pokemon.json', () => {
    expect(Object.values(POKEMON_FORM).sort()).toEqual(FORM_SPECIES.map((s) => s.id).sort())
  })

  it('cada forma es de una especie coleccionable, tiene su rareza y no sale entre las coleccionables', () => {
    for (const form of FORM_SPECIES) {
      const base = species(baseSpeciesOf(form.id))
      expect(SPECIES).toContain(base)
      expect(SPECIES).not.toContain(form)
      expect(rarityOf(form)).toBe(rarityOf(base))
      expect(isKnownSpecies(form.id)).toBe(true)
    }
  })

  it('cada objeto lleva a una forma distinta y vale para su especie y sus otras formas', () => {
    const forms = FORM_ITEM_IDS.map((id) => FORM_ITEMS[id].formId)
    expect(new Set(forms).size).toBe(forms.length)
    for (const id of FORM_ITEM_IDS) {
      const { formId } = FORM_ITEMS[id]
      expect(FORM_SPECIES.map((s) => s.id)).toContain(formId)
      expect(formItemsOf(baseSpeciesOf(formId))).toContain(id)
      expect(formItemsOf(formId)).toContain(id)
    }
  })

  it('una especie sin formas no tiene objetos de forma', () => {
    const withForms = new Set(FORM_SPECIES.map((s) => baseSpeciesOf(s.id)))
    const plain = SPECIES.find((s) => !withForms.has(s.id))!
    expect(formItemsOf(plain.id)).toEqual([])
  })
})

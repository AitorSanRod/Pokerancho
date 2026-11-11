import { describe, expect, it } from 'vitest'
import { signLines } from './signpost'

describe('signLines', () => {
  it('pasa el texto a mayúsculas sin tildes', () => {
    expect(signLines('Jardín')).toEqual(['JARDIN'])
  })

  it('parte en « - » y en palabras cuando no cabe', () => {
    expect(signLines('Ruta 1 - Jefe')).toEqual(['RUTA 1', 'JEFE'])
    expect(signLines('Una palabra muy larga otra palabra más larga').length).toBeGreaterThan(1)
  })
})

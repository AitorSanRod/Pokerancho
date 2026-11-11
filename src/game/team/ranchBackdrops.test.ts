import { describe, expect, it } from 'vitest'
import { DEFAULT_RANCH_BACKDROP, RanchBackdrop } from '../../data/ranchBackdrops'
import { initialState } from '../core/state'
import { ranchBackdrop, setRanchBackdrop } from './ranchBackdrops'

const OTHER = Object.values(RanchBackdrop).find((b) => b !== DEFAULT_RANCH_BACKDROP)!

describe('fondo del rancho', () => {
  it('sin elegir, se ve el de por defecto', () => {
    expect(ranchBackdrop(initialState(), 0)).toBe(DEFAULT_RANCH_BACKDROP)
  })

  it('se guarda el elegido y volver al de por defecto lo borra', () => {
    const s = initialState()
    expect(setRanchBackdrop(s, 0, OTHER)).toBe(true)
    expect(ranchBackdrop(s, 0)).toBe(OTHER)
    setRanchBackdrop(s, 0, DEFAULT_RANCH_BACKDROP)
    expect(s.ranchBackdropOf).toEqual({})
  })

  it('no se cambia el fondo de un rancho que no es suyo ni se pone uno que no existe', () => {
    const s = initialState()
    expect(setRanchBackdrop(s, 1, OTHER)).toBe(false)
    expect(setRanchBackdrop(s, 0, 'luna' as RanchBackdrop)).toBe(false)
    expect(s.ranchBackdropOf).toEqual({})
  })
})

import { describe, expect, it } from 'vitest'
import { initialState } from '../core/state'
import { defaultRanchName, RANCH_NAME_MAX_LENGTH, ranchName, renameRanch } from './ranchNames'

describe('nombre del rancho', () => {
  it('sin nombre propio se ve el de por defecto', () => {
    expect(ranchName(initialState(), 0)).toBe(defaultRanchName(0))
  })

  it('se guarda sin espacios de sobra y recortado al máximo', () => {
    const s = initialState()
    renameRanch(s, 0, '  Mi   prado  ')
    expect(ranchName(s, 0)).toBe('Mi prado')
    renameRanch(s, 0, 'x'.repeat(RANCH_NAME_MAX_LENGTH + 5))
    expect(ranchName(s, 0)).toHaveLength(RANCH_NAME_MAX_LENGTH)
  })

  it('un nombre vacío le devuelve el de por defecto', () => {
    const s = initialState()
    renameRanch(s, 0, 'Prado')
    renameRanch(s, 0, '   ')
    expect(s.ranchNames).toEqual({})
    expect(ranchName(s, 0)).toBe(defaultRanchName(0))
  })

  it('no se puede nombrar un rancho que no es suyo', () => {
    const s = initialState()
    expect(renameRanch(s, 1, 'Prado')).toBe(false)
    expect(s.ranchNames).toEqual({})
  })
})

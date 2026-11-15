import { describe, expect, it } from 'vitest'
import { initialState } from '../game/core/state'
import { loadSaved, writeSaved, type SaveStorage } from './persistence'
import { memoryStorage } from './test-storage'

describe('guardado en el navegador', () => {
  it('lo guardado se vuelve a cargar igual', () => {
    const storage = memoryStorage()
    const s = initialState()
    s.money = 1234
    expect(writeSaved(storage, s)).toBe(true)
    expect(loadSaved(storage).money).toBe(1234)
  })

  it('sin nada guardado, o si no se puede leer, empieza una partida nueva', () => {
    expect(loadSaved(memoryStorage()).money).toBe(initialState().money)
    const corrupt = memoryStorage()
    for (let i = 0; i < 2; i++) corrupt.setItem(`pokerancho-${i ? 'team' : 'save'}`, '{no es json')
    expect(loadSaved(corrupt).owned).toEqual([])
  })

  it('si el almacenamiento falla al guardar, lo dice sin romper', () => {
    const full: SaveStorage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError')
      },
    }
    expect(writeSaved(full, initialState())).toBe(false)
  })
})

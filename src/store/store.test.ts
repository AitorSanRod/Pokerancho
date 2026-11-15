import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { initialState } from '../game/core/state'
import { loadSaved, writeSaved } from './persistence'
import { memoryStorage } from './test-storage'
import { act, getState, replaceState, saveNow, startStore, stopSaving } from './store'

const savedMoney = (storage: ReturnType<typeof memoryStorage>) => loadSaved(storage).money

describe('estado vivo de la partida', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('carga la partida guardada al empezar', () => {
    const storage = memoryStorage()
    writeSaved(storage, { ...initialState(), money: 777 })
    startStore(storage)
    expect(getState().money).toBe(777)
  })

  it('act cambia una copia nueva y la guarda un poco después', () => {
    const storage = memoryStorage()
    startStore(storage)
    const before = getState()
    act((s) => void (s.money = 50))
    expect(getState()).not.toBe(before)
    expect(before.money).not.toBe(50)
    expect(storage.data.size).toBe(0)
    vi.runAllTimers()
    expect(savedMoney(storage)).toBe(50)
  })

  it('replaceState guarda en el acto', () => {
    const storage = memoryStorage()
    startStore(storage)
    replaceState({ ...initialState(), money: 9 })
    expect(savedMoney(storage)).toBe(9)
  })

  it('tras stopSaving ya no guarda nada (otra pestaña se ha quedado con la partida)', () => {
    const storage = memoryStorage()
    startStore(storage)
    act((s) => void (s.money = 1))
    saveNow()
    stopSaving()
    act((s) => void (s.money = 2))
    vi.runAllTimers()
    saveNow()
    expect(savedMoney(storage)).toBe(1)
  })
})

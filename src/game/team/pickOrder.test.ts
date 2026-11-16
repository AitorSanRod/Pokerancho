import { describe, expect, it, vi } from 'vitest'
import { POKEMON } from '../../data/pokemon'
import { initialState } from '../core/state'
import { createMon } from './mons'
import { byPickOrder } from './pickOrder'

vi.mock('../../data/maps/kantoMaps', () => import('../core/test-map'))

describe('orden para elegir Pokémon', () => {
  it('pone primero los favoritos y ordena cada grupo por nivel, de mayor a menor', () => {
    const s = initialState()
    const lowFav = createMon(POKEMON.Bulbasaur, 3)
    const highFav = createMon(POKEMON.Bulbasaur, 7)
    const low = createMon(POKEMON.Charmander, 4)
    const high = createMon(POKEMON.Charmander, 9)
    s.favorites = [POKEMON.Bulbasaur]
    expect(byPickOrder(s, [low, lowFav, high, highFav])).toEqual([highFav, lowFav, high, low])
  })

  it('no cambia la lista que recibe', () => {
    const s = initialState()
    const mons = [createMon(POKEMON.Bulbasaur, 3), createMon(POKEMON.Bulbasaur, 7)]
    const before = [...mons]
    byPickOrder(s, mons)
    expect(mons).toEqual(before)
  })
})

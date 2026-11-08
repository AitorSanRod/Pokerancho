import { describe, expect, it } from 'vitest'
import { POKEMON } from '../../data/pokemon'
import { initialState } from '../core/state'
import { species } from '../../data/species'
import { EVOLVING_SPECIES, evolutionsOf } from '../../data/evolutions'
import { chooseStarter } from '../core/test-utils'
import { isCaughtByLine, isFavorite, knownName, markCaught, markEvolutionLines, markSeen, toggleFavorite } from './dex'

describe('knownName', () => {
  it('oculta el nombre hasta que la especie se ha visto', () => {
    const s = initialState()
    expect(knownName(s, POKEMON.Pidgey)).toBe('???')
    markSeen(s, POKEMON.Pidgey)
    expect(knownName(s, POKEMON.Pidgey)).toBe(species(POKEMON.Pidgey).name)
  })
})

describe('toggleFavorite', () => {
  it('marca y desmarca una especie vista', () => {
    const s = initialState()
    markSeen(s, POKEMON.Pidgey)
    toggleFavorite(s, POKEMON.Pidgey)
    expect(isFavorite(s, POKEMON.Pidgey)).toBe(true)
    toggleFavorite(s, POKEMON.Pidgey)
    expect(isFavorite(s, POKEMON.Pidgey)).toBe(false)
  })

  it('no marca especies que aún no se han visto', () => {
    const s = initialState()
    toggleFavorite(s, POKEMON.Pidgey)
    expect(isFavorite(s, POKEMON.Pidgey)).toBe(false)
  })
})

/** Una especie que evoluciona dos veces seguidas: [primera, segunda, tercera] */
function threeStageLine(): [number, number, number] {
  for (const first of EVOLVING_SPECIES)
    for (const { into: second } of evolutionsOf(first)) {
      const third = evolutionsOf(second)[0]?.into
      if (third !== undefined) return [first, second, third]
    }
  throw new Error('no hay líneas de tres')
}

describe('línea evolutiva', () => {
  it('capturar una evolución da por capturadas y vistas las anteriores de su línea', () => {
    const [first, second, third] = threeStageLine()
    const s = initialState()
    markCaught(s, third)
    expect(s.caught).toEqual(expect.arrayContaining([first, second, third]))
    expect(s.seen).toEqual(expect.arrayContaining([first, second, third]))
  })

  it('repasa las partidas que tenían la evolución capturada sin su línea', () => {
    const [first, second, third] = threeStageLine()
    const s = initialState()
    s.caught = [third]
    markEvolutionLines(s)
    expect(s.caught).toEqual(expect.arrayContaining([first, second]))
    expect(s.seen).toEqual(expect.arrayContaining([first, second]))
  })

  it('distingue lo capturado por línea de lo que está en el equipo', () => {
    const [first, second] = threeStageLine()
    const s = initialState()
    chooseStarter(s, second)
    expect(isCaughtByLine(s, first)).toBe(true)
    expect(isCaughtByLine(s, second)).toBe(false)
    chooseStarter(s, first)
    expect(isCaughtByLine(s, first)).toBe(false)
  })
})

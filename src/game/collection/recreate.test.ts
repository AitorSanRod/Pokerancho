import { describe, expect, it } from 'vitest'
import { Nature } from '../../data/natures'
import { POKEMON } from '../../data/pokemon'
import { Rarity } from '../../data/species'
import { initialState, ownedOfSpecies, type Expedition } from '../core/state'
import { chooseStarter, seqRng, speciesOfRarity } from '../core/test-utils'
import { NEW_MON_LEVEL } from '../team/mons'
import { addStarItems, starItemFor, starItemsOf } from './starItems'
import { addPieces, PIECES_PER_COMBINE, piecesOf, SHINY_CHANCE } from './pieces'
import { recreate, recreateBlocker, recreatePrice } from './recreate'

/** Partida con el inicial mejorado, dinero de sobra y los tickets justos para volver a crearlo */
function grownStarter(speciesId: number = POKEMON.Bulbasaur) {
  const s = initialState()
  chooseStarter(s, speciesId)
  Object.assign(s.owned[0], { level: NEW_MON_LEVEL + 20, stars: 2, exp: 7 })
  s.money = 1e9
  addPieces(s, speciesId, PIECES_PER_COMBINE)
  return s
}

describe('recreate', () => {
  it('borra el Pokémon y crea otro nuevo en su lugar, al nivel de los nuevos y sin ★', () => {
    const s = grownStarter()
    const old = s.owned[0]
    expect(recreate(s, POKEMON.Bulbasaur, seqRng(0.999))).toMatchObject({ speciesId: POKEMON.Bulbasaur, level: NEW_MON_LEVEL, shiny: false })
    const mon = ownedOfSpecies(s, POKEMON.Bulbasaur)!
    expect(s.owned).toHaveLength(1)
    expect(mon.uid).not.toBe(old.uid)
    expect(mon).toMatchObject({ level: NEW_MON_LEVEL, stars: 0, exp: 0, ranch: old.ranch, tmMoves: [] })
  })

  it('sigue de compañero si lo era', () => {
    const s = grownStarter()
    recreate(s, POKEMON.Bulbasaur)
    expect(s.activeUid).toBe(s.owned[0].uid)
  })

  it('cobra lo de crearlo y gasta los tickets', () => {
    const s = grownStarter()
    addPieces(s, POKEMON.Bulbasaur, 2)
    recreate(s, POKEMON.Bulbasaur)
    expect(s.money).toBe(1e9 - recreatePrice(POKEMON.Bulbasaur))
    expect(piecesOf(s, POKEMON.Bulbasaur)).toBe(2)
  })

  it('tira naturaleza y shiny de nuevo', () => {
    const s = grownStarter()
    const result = recreate(s, POKEMON.Bulbasaur, seqRng(0.999, SHINY_CHANCE / 2))
    expect(result).toMatchObject({ nature: Object.values(Nature).at(-1), shiny: true })
    expect(s.owned[0].shiny).toBe(true)
  })

  it('pide y gasta el objeto estelar de las que no son comunes', () => {
    const rare = speciesOfRarity(Rarity.Rare)
    const s = grownStarter(rare)
    const item = starItemFor(rare)!
    expect(recreateBlocker(s, rare)).not.toBeNull()
    addStarItems(s, item, 1)
    expect(recreate(s, rare)).not.toBeNull()
    expect(starItemsOf(s, item)).toBe(0)
  })

  it('no se puede sin tenerlo, sin tickets, sin dinero ni fuera del rancho, y no toca nada', () => {
    const s = grownStarter()
    expect(recreate(s, POKEMON.Pidgey)).toBeNull()

    const poor = grownStarter()
    poor.money = 0
    expect(recreate(poor, POKEMON.Bulbasaur)).toBeNull()

    const noTickets = grownStarter()
    noTickets.pieces[POKEMON.Bulbasaur] = PIECES_PER_COMBINE - 1
    expect(recreate(noTickets, POKEMON.Bulbasaur)).toBeNull()

    const away = grownStarter()
    away.expeditions.push({ uid: away.owned[0].uid } as Expedition)
    expect(recreateBlocker(away, POKEMON.Bulbasaur)).not.toBeNull()
    expect(recreate(away, POKEMON.Bulbasaur)).toBeNull()
    expect(away.owned[0].stars).toBe(2)
  })
})

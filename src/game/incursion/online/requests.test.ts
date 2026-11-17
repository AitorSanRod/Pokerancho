import { describe, expect, it } from 'vitest'
import { INCURSIONS } from '../../../data/incursions'
import { SPECIES } from '../../../data/species'
import { freshMember } from '../party'
import { repertoire } from '../repertoire'
import { IncursionAction } from './protocol'
import { parseIncursionRequest, parseMember } from './requests'

const INC = INCURSIONS[0]
const SPECIES_ID = SPECIES[0].id
const MOVE = repertoire(SPECIES_ID, INC.minLevel)[0].id
const who = { playerId: 'jugador-uno', nickname: '  Rojo  ' }
const member = (extra: object = {}) => ({ ...freshMember({ id: 'abc123', speciesId: SPECIES_ID, level: INC.minLevel, stars: 0, moveId: MOVE }), ...extra })
const parse = (extra: object = {}) => parseMember(INC.id, member(extra))

describe('peticiones de incursión', () => {
  it('acepta un Pokémon válido y limpia el apodo', () => {
    expect(parse()).toMatchObject({ id: 'abc123' })
    expect(parseIncursionRequest({ action: IncursionAction.Sync, ...who, groupId: 'abcdef12' })).toMatchObject({ nickname: 'Rojo' })
  })

  it('rechaza un Pokémon fuera de nivel, debilitado o con un movimiento que no conoce', () => {
    expect(parse({ level: INC.maxLevel + 1 })).toBeNull()
    expect(parse({ level: INC.minLevel - 1 })).toBeNull()
    expect(parse({ hpFraction: 0 })).toBeNull()
    expect(parse({ moveId: 'no-existe' })).toBeNull()
  })

  it('rechaza un grupo con un id raro', () => {
    expect(parseIncursionRequest({ action: IncursionAction.Sync, ...who, groupId: '../x' })).toBeNull()
  })

  it('acepta votar y seguir en un grupo', () => {
    expect(parseIncursionRequest({ action: IncursionAction.Vote, ...who, groupId: 'abcdef12', retreat: true })).toMatchObject({ retreat: true })
    expect(parseIncursionRequest({ action: IncursionAction.Vote, ...who, groupId: 'abcdef12' })).toBeNull()
    expect(parseIncursionRequest({ action: IncursionAction.Ready, ...who, groupId: 'abcdef12' })).not.toBeNull()
  })

  it('el Pokémon conserva si es shiny; cualquier otro valor cuenta como normal', () => {
    expect(parse({ shiny: true })).toMatchObject({ shiny: true })
    expect(parse({ shiny: 1 })).toMatchObject({ shiny: undefined })
  })
})

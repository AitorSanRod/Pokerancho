import { describe, expect, it } from 'vitest'
import { INCURSIONS } from '../../../data/incursions'
import { SPECIES } from '../../../data/species'
import { freshMember } from '../party'
import { repertoire } from '../repertoire'
import { IncursionAction } from './protocol'
import { parseIncursionRequest } from './requests'

const INC = INCURSIONS[0]
const SPECIES_ID = SPECIES[0].id
const MOVE = repertoire(SPECIES_ID, INC.minLevel)[0].id
const who = { playerId: 'jugador-uno', nickname: '  Rojo  ' }
const member = (extra: object = {}) => ({ ...freshMember({ id: 'abc123', speciesId: SPECIES_ID, level: INC.minLevel, stars: 0, moveId: MOVE }), ...extra })
const queue = (extra: object = {}) => ({ action: IncursionAction.Queue, ...who, incursionId: INC.id, member: member(extra) })

describe('peticiones de incursión', () => {
  it('acepta entrar en la cola con un Pokémon válido y limpia el apodo', () => {
    expect(parseIncursionRequest(queue())).toMatchObject({ action: IncursionAction.Queue, nickname: 'Rojo', member: { id: 'abc123' } })
  })

  it('rechaza un Pokémon fuera de nivel, debilitado o con un movimiento que no conoce', () => {
    expect(parseIncursionRequest(queue({ level: INC.maxLevel + 1 }))).toBeNull()
    expect(parseIncursionRequest(queue({ level: INC.minLevel - 1 }))).toBeNull()
    expect(parseIncursionRequest(queue({ hpFraction: 0 }))).toBeNull()
    expect(parseIncursionRequest(queue({ moveId: 'no-existe' }))).toBeNull()
  })

  it('rechaza una incursión que no existe o un grupo con un id raro', () => {
    expect(parseIncursionRequest({ ...queue(), incursionId: 'otra' })).toBeNull()
    expect(parseIncursionRequest({ action: IncursionAction.Sync, ...who, groupId: '../x' })).toBeNull()
  })

  it('acepta votar y seguir en un grupo', () => {
    expect(parseIncursionRequest({ action: IncursionAction.Vote, ...who, groupId: 'abcdef12', retreat: true })).toMatchObject({ retreat: true })
    expect(parseIncursionRequest({ action: IncursionAction.Vote, ...who, groupId: 'abcdef12' })).toBeNull()
    expect(parseIncursionRequest({ action: IncursionAction.Ready, ...who, groupId: 'abcdef12' })).not.toBeNull()
  })

  it('el Pokémon conserva si es shiny; cualquier otro valor cuenta como normal', () => {
    expect(parseIncursionRequest(queue({ shiny: true }))).toMatchObject({ member: { shiny: true } })
    expect(parseIncursionRequest(queue({ shiny: 1 }))).toMatchObject({ member: { shiny: undefined } })
  })
})

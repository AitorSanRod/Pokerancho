import { describe, expect, it } from 'vitest'
import { INCURSIONS } from '../../../data/incursions'
import { SPECIES } from '../../../data/species'
import { needsKey } from '../keys'
import { freshMember } from '../party'
import { repertoire } from '../repertoire'
import { ScheduleAction } from './scheduleProtocol'
import { parseScheduleRequest } from './scheduleRequests'

const PAID = INCURSIONS.find((i) => needsKey(i.id))!
const FREE = INCURSIONS.find((i) => !needsKey(i.id))
const who = { playerId: 'jugador-uno', nickname: '  Rojo  ' }
const one = { ...who, scheduleId: 'abcdef12' }
const member = (extra: object = {}) => ({
  ...freshMember({ id: 'abc123', speciesId: SPECIES[0].id, level: PAID.minLevel, stars: 0, moveId: repertoire(SPECIES[0].id, PAID.minLevel)[0].id }),
  ...extra,
})

describe('peticiones de incursiones programadas', () => {
  it('acepta crear una con fianza entera y limpia el apodo', () => {
    const req = parseScheduleRequest({ action: ScheduleAction.Create, ...who, incursionId: PAID.id, startAt: 123, bond: 50 })
    expect(req).toMatchObject({ action: ScheduleAction.Create, nickname: 'Rojo', bond: 50 })
  })

  it('no se programa una incursión gratuita ni con una fianza rara', () => {
    if (FREE) expect(parseScheduleRequest({ action: ScheduleAction.Create, ...who, incursionId: FREE.id, startAt: 123, bond: 0 })).toBeNull()
    expect(parseScheduleRequest({ action: ScheduleAction.Create, ...who, incursionId: PAID.id, startAt: 123, bond: -1 })).toBeNull()
    expect(parseScheduleRequest({ action: ScheduleAction.Join, ...one, bond: 1.5 })).toBeNull()
  })

  it('rechaza un id de incursión programada raro', () => {
    expect(parseScheduleRequest({ action: ScheduleAction.Sync, ...who, scheduleId: '../x' })).toBeNull()
  })

  it('marcar exige un Pokémon que pueda entrar', () => {
    expect(parseScheduleRequest({ action: ScheduleAction.Mark, ...one, incursionId: PAID.id, member: member() })).toMatchObject({ member: { id: 'abc123' } })
    expect(parseScheduleRequest({ action: ScheduleAction.Mark, ...one, incursionId: PAID.id, member: member({ level: PAID.maxLevel + 1 }) })).toBeNull()
  })

  it('las acciones sencillas solo piden la incursión programada', () => {
    for (const action of [ScheduleAction.Leave, ScheduleAction.Cancel, ScheduleAction.Sync, ScheduleAction.CheckIn, ScheduleAction.Lock]) {
      expect(parseScheduleRequest({ action, ...one })).toMatchObject({ action })
    }
    expect(parseScheduleRequest({ action: 'otra', ...one })).toBeNull()
  })
})

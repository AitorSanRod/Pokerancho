import { describe, expect, it } from 'vitest'
import { StatusId } from '../../data/passives'
import { EventKind } from './events'
import { endOfTurn, inflict, STATUS_MAX_TURNS } from './groupStatus'
import { ally, enemy, field } from './incursion-test-utils'
import { leaveRoom } from './restRooms'

/** Un estado que no quita PS ni hace perder el turno por sí solo al final del turno */
const STATUS = StatusId.Paralysis

describe('estados alterados en incursiones', () => {
  it('duran como mucho STATUS_MAX_TURNS turnos y luego se le pasan', () => {
    const a = ally('a')
    const { bf, events } = field([a], [enemy('e')])
    inflict(bf, a, STATUS)
    for (let i = 1; i < STATUS_MAX_TURNS; i++) endOfTurn(bf)
    expect(a.status).toBe(STATUS)
    endOfTurn(bf)
    expect(a.status).toBeNull()
    expect(events.some((e) => e.kind === EventKind.Recover && e.target === a.id)).toBe(true)
  })

  it('volver a ponerle el mismo estado lo renueva; otro distinto no entra', () => {
    const a = ally('a')
    const { bf } = field([a], [enemy('e')])
    inflict(bf, a, STATUS)
    for (let i = 1; i < STATUS_MAX_TURNS; i++) endOfTurn(bf)
    expect(inflict(bf, a, STATUS)).toBe(true)
    expect(a.statusTurns).toBe(STATUS_MAX_TURNS)
    expect(inflict(bf, a, StatusId.Burn)).toBe(false)
    expect(a.status).toBe(STATUS)
  })

  it('al acabar la sala se quitan', () => {
    const a = ally('a')
    const { bf } = field([a], [enemy('e')])
    inflict(bf, a, STATUS)
    leaveRoom(bf)
    expect(a.status).toBeNull()
  })
})

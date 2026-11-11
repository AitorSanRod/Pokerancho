import { describe, expect, it } from 'vitest'
import { StatusId } from '../../data/passives'
import { EventKind } from './events'
import type { GroupFighter } from './fighter'
import { BOSS_MAX_STATUSES, endOfTurn, hasStatus, inflict, STATUS_MAX_TURNS } from './groupStatus'
import { ally, enemy, field } from './incursion-test-utils'
import { leaveRoom } from './restRooms'
import { inflictTarget } from './targeting'

/** Un estado que no quita PS ni hace perder el turno por sí solo al final del turno */
const STATUS = StatusId.Paralysis
/** Estados distintos, tantos como le caben a un jefe y uno más */
const MANY = Object.values(StatusId).slice(0, BOSS_MAX_STATUSES + 1)

const boss = (id = 'j'): GroupFighter => enemy(id, { boss: {} })
const statusesOf = (f: GroupFighter) => f.statuses.map((a) => a.status)

describe('estados alterados en incursiones', () => {
  it('duran como mucho STATUS_MAX_TURNS turnos y luego se le pasan', () => {
    const a = ally('a')
    const { bf, events } = field([a], [enemy('e')])
    inflict(bf, a, STATUS)
    for (let i = 1; i < STATUS_MAX_TURNS; i++) endOfTurn(bf)
    expect(hasStatus(a, STATUS)).toBe(true)
    endOfTurn(bf)
    expect(a.statuses).toEqual([])
    expect(events.some((e) => e.kind === EventKind.Recover && e.target === a.id)).toBe(true)
  })

  it('volver a ponerle el mismo estado lo renueva; otro distinto no entra', () => {
    const a = ally('a')
    const { bf } = field([a], [enemy('e')])
    inflict(bf, a, STATUS)
    for (let i = 1; i < STATUS_MAX_TURNS; i++) endOfTurn(bf)
    expect(inflict(bf, a, STATUS)).toBe(true)
    expect(a.statuses[0].turns).toBe(STATUS_MAX_TURNS)
    expect(inflict(bf, a, StatusId.Burn)).toBe(false)
    expect(statusesOf(a)).toEqual([STATUS])
  })

  it('un jefe lleva hasta BOSS_MAX_STATUSES estados distintos a la vez', () => {
    const j = boss()
    const { bf } = field([ally('a')], [j])
    const accepted = MANY.map((s) => inflict(bf, j, s))
    expect(accepted).toEqual(MANY.map((_, i) => i < BOSS_MAX_STATUSES))
    expect(statusesOf(j)).toEqual(MANY.slice(0, BOSS_MAX_STATUSES))
    expect(inflict(bf, j, MANY[0])).toBe(true)
    expect(j.statuses).toHaveLength(BOSS_MAX_STATUSES)
  })

  it('cada estado del jefe se le pasa a su tiempo', () => {
    const j = boss()
    const { bf } = field([ally('a')], [j])
    inflict(bf, j, STATUS)
    endOfTurn(bf)
    inflict(bf, j, StatusId.Confusion)
    for (let i = 1; i < STATUS_MAX_TURNS; i++) endOfTurn(bf)
    expect(statusesOf(j)).toEqual([StatusId.Confusion])
  })

  it('los estados se siguen dirigiendo a un jefe que ya tiene uno', () => {
    const a = ally('a')
    const j = boss()
    const { bf } = field([a], [j])
    inflict(bf, j, STATUS)
    expect(inflictTarget(bf, a, () => 0)).toBe(j)
  })

  it('al acabar la sala se quitan', () => {
    const a = ally('a')
    const { bf } = field([a], [enemy('e')])
    inflict(bf, a, STATUS)
    leaveRoom(bf)
    expect(a.statuses).toEqual([])
  })
})

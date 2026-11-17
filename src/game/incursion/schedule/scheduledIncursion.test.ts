import { describe, expect, it, vi } from 'vitest'
import { TEST_INCURSION } from '../incursion-test-mock'
import { PARTY_SIZE } from '../party'
import { joiner, member, newSchedule, NOW, slotIn } from './schedule-test-utils'
import { cancelSchedule, createSchedule, joinSchedule, leaveSchedule, ScheduleRefusal } from './scheduledIncursion'
import { checkInSchedule, lockSchedule, markSchedule } from './scheduleRoom'
import { checkInOpensAt, leaveDeadline, MAX_CREATED, MAX_JOINED, SCHEDULE_GAP_MS, ScheduleCancel, SLOT_MS } from './scheduleRules'

vi.mock('../../../data/incursions', () => import('../incursion-test-mock'))

const id = (n: number) => `abcdef${String(n).padStart(2, '0')}`
/** Incursiones de otros, separadas entre sí lo justo para no chocar */
const spaced = (count: number) => Array.from({ length: count }, (_, i) => newSchedule(slotIn() + (i + 1) * Math.ceil(SCHEDULE_GAP_MS / SLOT_MS) * SLOT_MS, id(i)))

describe('programar y apuntarse', () => {
  it('el creador ocupa el primer hueco con su fianza', () => {
    const sched = newSchedule()
    expect(sched.seats).toEqual([expect.objectContaining({ playerId: 'jugador-0', bond: 100, checkedIn: false })])
  })

  it('no se puede programar fuera de las franjas', () => {
    expect(createSchedule('abcdef12', TEST_INCURSION.id, slotIn() + 1, joiner(0), [], NOW)).toBe(ScheduleRefusal.BadSlot)
  })

  it('los huecos se llenan por orden y con todos ocupados no entra nadie más', () => {
    const sched = newSchedule()
    for (let i = 1; i < PARTY_SIZE; i++) expect(joinSchedule(sched, joiner(i), [], NOW)).toBeNull()
    expect(sched.seats.map((s) => s.playerId)).toEqual(Array.from({ length: PARTY_SIZE }, (_, i) => `jugador-${i}`))
    expect(joinSchedule(sched, joiner(PARTY_SIZE), [], NOW)).toBe(ScheduleRefusal.Full)
  })

  it('aceptarla otra vez no ocupa otro hueco', () => {
    const sched = newSchedule()
    expect(joinSchedule(sched, joiner(0), [], NOW)).toBe(ScheduleRefusal.AlreadyIn)
    expect(sched.seats).toHaveLength(1)
  })

  it('con la sala abierta ya no se puede aceptar', () => {
    const sched = newSchedule()
    expect(joinSchedule(sched, joiner(1), [], checkInOpensAt(sched.startAt))).toBe(ScheduleRefusal.WrongPhase)
  })
})

describe('topes y horario', () => {
  it('no se pueden crear más de las permitidas a la vez', () => {
    const mine = spaced(MAX_CREATED).map((s) => ({ ...s, creatorId: 'jugador-9' }))
    expect(createSchedule('ffffffff', TEST_INCURSION.id, slotIn(), joiner(9), mine, NOW)).toBe(ScheduleRefusal.TooManyCreated)
  })

  it('no se pueden aceptar más de las permitidas a la vez', () => {
    const mine = spaced(MAX_JOINED)
    expect(joinSchedule(newSchedule(slotIn(), 'ffffffff'), joiner(9), mine, NOW)).toBe(ScheduleRefusal.TooManyJoined)
  })

  it('dos incursiones del mismo jugador no pueden empezar demasiado cerca', () => {
    const other = newSchedule(slotIn() + SLOT_MS, 'eeeeeeee')
    expect(joinSchedule(newSchedule(), joiner(9), [other], NOW)).toBe(ScheduleRefusal.Overlap)
  })
})

describe('bajas y cancelación', () => {
  it('un apuntado se da de baja hasta el plazo; después, no', () => {
    const sched = newSchedule()
    joinSchedule(sched, joiner(1), [], NOW)
    expect(leaveSchedule(sched, 'jugador-1', leaveDeadline(sched.startAt))).toBe(ScheduleRefusal.WrongPhase)
    expect(leaveSchedule(sched, 'jugador-1', NOW)).toBeNull()
    expect(sched.seats).toHaveLength(1)
  })

  it('el creador no se da de baja: la cancela, solo él y hasta el plazo', () => {
    const sched = newSchedule()
    joinSchedule(sched, joiner(1), [], NOW)
    expect(leaveSchedule(sched, 'jugador-0', NOW)).toBe(ScheduleRefusal.NotCreator)
    expect(cancelSchedule(sched, 'jugador-1', NOW)).toBe(ScheduleRefusal.NotCreator)
    expect(cancelSchedule(sched, 'jugador-0', leaveDeadline(sched.startAt))).toBe(ScheduleRefusal.WrongPhase)
    expect(cancelSchedule(sched, 'jugador-0', checkInOpensAt(sched.startAt))).toBe(ScheduleRefusal.WrongPhase)
    expect(cancelSchedule(sched, 'jugador-0', leaveDeadline(sched.startAt) - 1)).toBeNull()
    expect(sched.cancelledBy).toBe(ScheduleCancel.Creator)
  })
})

describe('sala del checkin', () => {
  const inRoom = () => {
    const sched = newSchedule()
    return { sched, at: checkInOpensAt(sched.startAt) }
  }

  it('el checkin solo vale con la sala abierta', () => {
    const { sched, at } = inRoom()
    expect(checkInSchedule(sched, 'jugador-0', at - 1)).toBe(ScheduleRefusal.WrongPhase)
    expect(checkInSchedule(sched, 'jugador-0', at)).toBeNull()
    expect(checkInSchedule(sched, 'otro', at)).toBe(ScheduleRefusal.NotIn)
  })

  it('se marca y cambia el Pokémon hasta fijarlo', () => {
    const { sched, at } = inRoom()
    expect(markSchedule(sched, 'jugador-0', member(0), at)).toBe(ScheduleRefusal.NotIn)
    checkInSchedule(sched, 'jugador-0', at)
    expect(markSchedule(sched, 'jugador-0', member(0), at)).toBeNull()
    expect(lockSchedule(sched, 'jugador-0', at)).toBeNull()
    expect(markSchedule(sched, 'jugador-0', member(1), at)).toBe(ScheduleRefusal.Locked)
    expect(sched.seats[0].member?.id).toBe('mon0')
  })

  it('un Pokémon fuera del nivel de entrada no se puede marcar', () => {
    const { sched, at } = inRoom()
    checkInSchedule(sched, 'jugador-0', at)
    expect(markSchedule(sched, 'jugador-0', member(0, TEST_INCURSION.maxLevel + 1), at)).toBe(ScheduleRefusal.BadMember)
  })

  it('sin Pokémon marcado no se puede fijar', () => {
    const { sched, at } = inRoom()
    checkInSchedule(sched, 'jugador-0', at)
    expect(lockSchedule(sched, 'jugador-0', at)).toBe(ScheduleRefusal.NotIn)
  })
})

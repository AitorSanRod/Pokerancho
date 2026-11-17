import { describe, expect, it, vi } from 'vitest'
import { seqRng } from '../../core/test-utils'
import { joiner, member, newSchedule, NOW } from './schedule-test-utils'
import { joinSchedule } from './scheduledIncursion'
import { checkInSchedule, markSchedule } from './scheduleRoom'
import { checkInOpensAt, SchedulePhase } from './scheduleRules'
import { startSchedule } from './scheduleStart'
import { scheduleView } from './scheduleView'

vi.mock('../../../data/incursions', () => import('../incursion-test-mock'))

describe('vista de una incursión programada', () => {
  it('muestra los huecos sin la fianza de los demás y la suya aparte', () => {
    const sched = newSchedule()
    joinSchedule(sched, joiner(1, 555), [], NOW)
    const view = scheduleView(sched, 'jugador-1', NOW)
    expect(view.seats.map((s) => s.nickname)).toEqual(['J0', 'J1'])
    expect(JSON.stringify(view.seats)).not.toContain('555')
    expect(view.you).toMatchObject({ bond: 555, checkedIn: false })
    expect(view.creator).toBe('J0')
    expect(view.yoursToCancel).toBe(false)
    expect(view.phase).toBe(SchedulePhase.Open)
  })

  it('a quien no está apuntado no le da hueco ni reparto', () => {
    const view = scheduleView(newSchedule(), 'otro', NOW)
    expect(view.you).toBeNull()
    expect(view.shares).toBeNull()
  })

  it('el Pokémon marcado se ve; el reparto, solo cuando ya se ha decidido', () => {
    const sched = newSchedule()
    joinSchedule(sched, joiner(1), [], NOW)
    const room = checkInOpensAt(sched.startAt)
    checkInSchedule(sched, 'jugador-0', room)
    markSchedule(sched, 'jugador-0', member(0), room)
    expect(scheduleView(sched, 'jugador-0', room).seats[0].speciesId).toBe(member(0).speciesId)
    expect(scheduleView(sched, 'jugador-0', room).shares).toBeNull()
    startSchedule(sched, 'aaaaaaaa', sched.startAt, seqRng(0.5))
    expect(scheduleView(sched, 'jugador-0', sched.startAt).shares).toBe(sched.seats[1].bond)
    expect(scheduleView(sched, 'jugador-1', sched.startAt).shares).toBe(0)
  })
})

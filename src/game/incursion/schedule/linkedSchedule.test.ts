import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POKEMON } from '../../../data/pokemon'
import { initialState, MonPlace, monPlace, type GameState } from '../../core/state'
import { seqRng } from '../../core/test-utils'
import { createMon } from '../../team/mons'
import { TEST_INCURSION } from '../incursion-test-mock'
import { joiner, newSchedule, NOW } from './schedule-test-utils'
import { applyScheduleView, bondOf, expireSchedules, scheduleBlocker, scheduleGone } from './linkedSchedule'
import { cancelSchedule, joinSchedule, leaveSchedule, type ScheduledIncursion } from './scheduledIncursion'
import { lockSchedule, markSchedule, checkInSchedule } from './scheduleRoom'
import { checkinMember } from './scheduleCheckin'
import { bondFor, checkInOpensAt, SCHEDULE_TTL_MS } from './scheduleRules'
import { startSchedule } from './scheduleStart'
import { scheduleView } from './scheduleView'

vi.mock('../../../data/incursions', () => import('../incursion-test-mock'))

const MONEY = 1000
const ME = 'jugador-1'
let s: GameState
let sched: ScheduledIncursion

beforeEach(() => {
  s = initialState()
  s.money = MONEY
  s.owned.push(createMon(POKEMON.Snorlax, TEST_INCURSION.minLevel, 0))
  s.incursionKeys[TEST_INCURSION.id] = 1
  sched = newSchedule()
  joinSchedule(sched, joiner(1, bondFor(MONEY)), [], NOW)
})

const see = (at: number, who = ME) => applyScheduleView(s, scheduleView(sched, who, at), at)
const room = () => checkInOpensAt(sched.startAt)

describe('fianza en la partida', () => {
  it('al aceptar se retiene una sola vez, sin contar como gasto', () => {
    see(NOW)
    see(NOW)
    expect(s.money).toBe(MONEY - bondFor(MONEY))
    expect(s.incursionBonds).toHaveLength(1)
  })

  it('crear y aceptar exigen un Pokémon con el nivel de entrada', () => {
    expect(scheduleBlocker(s, TEST_INCURSION.id)).toBeNull()
    s.owned = [createMon(POKEMON.Snorlax, TEST_INCURSION.minLevel - 1, 0)]
    expect(scheduleBlocker(s, TEST_INCURSION.id)).not.toBeNull()
  })

  it('al darse de baja o si el creador cancela, se devuelve', () => {
    see(NOW)
    leaveSchedule(sched, ME, NOW)
    see(NOW)
    expect(s.money).toBe(MONEY)
    joinSchedule(sched, joiner(1, bondFor(MONEY)), [], NOW)
    see(NOW)
    cancelSchedule(sched, 'jugador-0', NOW)
    see(NOW)
    expect(s.money).toBe(MONEY)
    expect(s.incursionBonds).toEqual([])
  })

  it('si el servidor la ha olvidado, se devuelve lo no devuelto', () => {
    see(NOW)
    scheduleGone(s, sched.id)
    expect(s.money).toBe(MONEY)
  })
})

describe('checkin y comienzo en la partida', () => {
  it('el checkin devuelve la fianza una sola vez y marca el primer Pokémon disponible', () => {
    see(NOW)
    checkInSchedule(sched, ME, room())
    see(room())
    see(room())
    expect(s.money).toBe(MONEY)
    expect(s.incursionCheckin?.uid).toBe(s.owned[0].uid)
    expect(monPlace(s, s.owned[0].uid)).toBe(MonPlace.Incursion)
  })

  it('si el servidor ya lo tiene fijado, la partida lo adopta', () => {
    see(NOW)
    checkInSchedule(sched, ME, room())
    see(room())
    markSchedule(sched, ME, checkinMember(s)!, room())
    lockSchedule(sched, ME, room())
    s.incursionCheckin!.locked = false
    see(room())
    expect(s.incursionCheckin?.locked).toBe(true)
  })

  it('sin llave hace el checkin pero no marca Pokémon', () => {
    s.incursionKeys = {}
    see(NOW)
    checkInSchedule(sched, ME, room())
    see(room())
    expect(s.incursionCheckin?.uid).toBeNull()
  })

  it('al decidirse, cobra su parte del reparto y la fianza se liquida', () => {
    const absent = sched.seats[0].bond
    see(NOW)
    checkInSchedule(sched, ME, room())
    see(room())
    startSchedule(sched, 'aaaaaaaa', sched.startAt, seqRng(0.5))
    see(sched.startAt)
    expect(s.money).toBe(MONEY + absent)
    expect(bondOf(s, sched.id)).toBeUndefined()
    expect(s.incursionCheckin).toBeNull()
  })

  it('quien no hizo el checkin pierde la fianza', () => {
    see(NOW)
    checkInSchedule(sched, 'jugador-0', room())
    startSchedule(sched, 'aaaaaaaa', sched.startAt, seqRng(0.5))
    see(sched.startAt)
    expect(s.money).toBe(MONEY - bondFor(MONEY))
    expect(s.incursionBonds).toEqual([])
  })

  it('el checkin sigue mientras el servidor pueda tener el grupo; sin noticias en mucho tiempo, caduca con la fianza', () => {
    see(NOW)
    checkInSchedule(sched, ME, room())
    see(room())
    expireSchedules(s, sched.startAt + SCHEDULE_TTL_MS)
    expect(s.incursionCheckin).not.toBeNull()
    expireSchedules(s, sched.startAt + SCHEDULE_TTL_MS + 1)
    expect(s.incursionCheckin).toBeNull()
    expect(s.incursionBonds).toEqual([])
    expect(s.money).toBe(MONEY)
  })
})

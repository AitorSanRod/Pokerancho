import { describe, expect, it, vi } from 'vitest'
import { seqRng } from '../../core/test-utils'
import { PARTY_SIZE } from '../party'
import { joiner, member, newSchedule, NOW } from './schedule-test-utils'
import { cancelSchedule, joinSchedule } from './scheduledIncursion'
import { checkInSchedule, lockSchedule, markSchedule } from './scheduleRoom'
import { checkInOpensAt, MIN_PLAYERS, ScheduleCancel } from './scheduleRules'
import { bondShares, isSettled, startSchedule } from './scheduleStart'

vi.mock('../../../data/incursions', () => import('../incursion-test-mock'))

/** Programada con `players` apuntados, con fianzas distintas; los de `present` hacen el checkin y marcan Pokémon */
function scheduled(players: number, present: number[], marked = present) {
  const sched = newSchedule()
  sched.seats[0].bond = 10
  for (let i = 1; i < players; i++) joinSchedule(sched, joiner(i, 10 * (i + 1)), [], NOW)
  const room = checkInOpensAt(sched.startAt)
  for (const i of present) checkInSchedule(sched, `jugador-${i}`, room)
  for (const i of marked) markSchedule(sched, `jugador-${i}`, member(i), room)
  return sched
}

describe('comienzo', () => {
  it('antes de la hora no empieza', () => {
    const sched = scheduled(2, [0])
    expect(startSchedule(sched, 'aaaaaaaa', sched.startAt - 1, seqRng(0.5))).toBeNull()
    expect(isSettled(sched)).toBe(false)
  })

  it('entran los que marcaron Pokémon, el resto son bots, y empieza a la hora de comienzo', () => {
    const sched = scheduled(3, [0, 2])
    const g = startSchedule(sched, 'aaaaaaaa', sched.startAt + 5000, seqRng(0.5))!
    expect(g.seats.map((s) => s.playerId)).toEqual(['jugador-0', 'jugador-2'])
    expect(g.members).toHaveLength(PARTY_SIZE)
    expect(g.legStarts).toEqual([sched.startAt])
    expect(sched.groupId).toBe('aaaaaaaa')
  })

  it('solo empieza una vez', () => {
    const sched = scheduled(2, [0, 1])
    startSchedule(sched, 'aaaaaaaa', sched.startAt, seqRng(0.5))
    expect(startSchedule(sched, 'bbbbbbbb', sched.startAt, seqRng(0.5))).toBeNull()
    expect(sched.groupId).toBe('aaaaaaaa')
  })

  it('sin nadie con Pokémon marcado se cancela', () => {
    const sched = scheduled(2, [0], [])
    expect(startSchedule(sched, 'aaaaaaaa', sched.startAt, seqRng(0.5))).toBeNull()
    expect(sched.cancelledBy).toBe(ScheduleCancel.TooFew)
  })

  it(`con menos de ${MIN_PLAYERS} jugadores con Pokémon no empieza: se cancela`, () => {
    const sched = scheduled(MIN_PLAYERS + 1, [0])
    expect(startSchedule(sched, 'aaaaaaaa', sched.startAt, seqRng(0.5))).toBeNull()
    expect(sched.cancelledBy).toBe(ScheduleCancel.TooFew)
  })

  it('si nadie más se apuntó, se cierra y se devuelve la fianza (sin reparto)', () => {
    const sched = scheduled(1, [0])
    expect(startSchedule(sched, 'aaaaaaaa', sched.startAt, seqRng(0.5))).toBeNull()
    expect(sched.cancelledBy).toBe(ScheduleCancel.Alone)
    expect(bondShares(sched)).toEqual({})
  })
})

describe('comienzo antes de la hora', () => {
  /** Programada con `players` apuntados, todos con Pokémon marcado; fijan los de `locked` */
  function lockedBy(players: number, locked: number[]) {
    const sched = scheduled(players, Array.from({ length: players }, (_, i) => i))
    for (const i of locked) lockSchedule(sched, `jugador-${i}`, checkInOpensAt(sched.startAt))
    return sched
  }

  it('si todos fijan su Pokémon en la sala, empieza ya', () => {
    const sched = lockedBy(3, [0, 1, 2])
    const at = checkInOpensAt(sched.startAt) + 1000
    const g = startSchedule(sched, 'aaaaaaaa', at, seqRng(0.5))!
    expect(g.seats).toHaveLength(3)
    expect(g.legStarts).toEqual([at])
    expect(isSettled(sched)).toBe(true)
  })

  it('mientras falte alguno por fijar, espera a la hora', () => {
    const sched = lockedBy(3, [0, 1])
    expect(startSchedule(sched, 'aaaaaaaa', checkInOpensAt(sched.startAt) + 1000, seqRng(0.5))).toBeNull()
    expect(isSettled(sched)).toBe(false)
  })

  it('solo, aunque fije, no empieza antes', () => {
    const sched = lockedBy(1, [0])
    expect(startSchedule(sched, 'aaaaaaaa', checkInOpensAt(sched.startAt) + 1000, seqRng(0.5))).toBeNull()
    expect(isSettled(sched)).toBe(false)
  })
})

describe('reparto de fianzas', () => {
  it('las fianzas de los ausentes se reparten a partes iguales, hacia abajo', () => {
    const sched = scheduled(4, [0, 1])
    const forfeited = sched.seats[2].bond + sched.seats[3].bond
    expect(bondShares(sched)).toEqual({ 'jugador-0': Math.floor(forfeited / 2), 'jugador-1': Math.floor(forfeited / 2) })
  })

  it('el que hizo el checkin sin Pokémon también cobra', () => {
    const sched = scheduled(3, [0, 1], [0])
    expect(Object.keys(bondShares(sched))).toEqual(['jugador-0', 'jugador-1'])
  })

  it('si nadie hizo el checkin, nadie recibe nada', () => {
    expect(bondShares(scheduled(3, []))).toEqual({})
  })

  it('también se reparte si se cancela por falta de Pokémon marcados', () => {
    const sched = scheduled(2, [0], [])
    startSchedule(sched, 'aaaaaaaa', sched.startAt, seqRng(0.5))
    expect(bondShares(sched)).toEqual({ 'jugador-0': sched.seats[1].bond })
  })

  it('si la cancela el creador no hay reparto', () => {
    const sched = scheduled(3, [])
    cancelSchedule(sched, 'jugador-0', NOW)
    expect(bondShares(sched)).toEqual({})
  })
})

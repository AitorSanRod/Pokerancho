import { describe, expect, it } from 'vitest'
import { RoomKind } from '../../data/incursions'
import { MoveKind } from '../../data/supportMoves'
import { battleRoom, member, NO_TAPS, supportOf, testIncursion, weakFoe } from './incursion-test-utils'
import { IncursionOutcome, simulateIncursion } from './incursionRun'
import { legDuration } from './incursionTimeline'

const MONEY = 10
const inc = testIncursion([battleRoom([weakFoe()], MONEY), { kind: RoomKind.Regroup, name: '' }, battleRoom([weakFoe()], MONEY)])
const members = [member('a'), member('b')]

describe('incursión entera', () => {
  it('sin las órdenes del tramo siguiente queda pendiente en la sala de reorganizar', () => {
    const rec = simulateIncursion(inc, members, [{ seed: 1, moves: {}, taps: [] }], null, NO_TAPS)
    expect(rec.outcome).toBe(IncursionOutcome.Pending)
    expect(rec.earned.money).toBe(MONEY)
  })

  it('con las órdenes de cada tramo la termina y suma lo de todos', () => {
    const rec = simulateIncursion(inc, members, [{ seed: 1, moves: {}, taps: [] }, { seed: 2, moves: {}, taps: [] }], null, NO_TAPS)
    expect(rec.outcome).toBe(IncursionOutcome.Win)
    expect(rec.earned.money).toBe(2 * MONEY)
  })

  it('al reorganizar, cada uno lucha el tramo siguiente con el movimiento que eligió', () => {
    const other = supportOf(MoveKind.Taunt).id
    const rec = simulateIncursion(inc, members, [{ seed: 1, moves: {}, taps: [] }, { seed: 2, moves: { a: other }, taps: [] }], null, NO_TAPS)
    expect(rec.legs[1].next.members.find((m) => m.id === 'a')?.moveId).toBe(other)
  })

  it('al retirarse se queda solo con lo ganado hasta ese momento', () => {
    const orders = [{ seed: 1, moves: {}, taps: [] }, { seed: 2, moves: {}, taps: [] }]
    const second = simulateIncursion(inc, members, orders, null, NO_TAPS).legs[1]
    const rec = simulateIncursion(inc, members, orders, { leg: 1, atMs: 0 }, NO_TAPS)
    expect(rec.outcome).toBe(IncursionOutcome.Retreat)
    expect(rec.earned.money).toBe(MONEY)
    const late = simulateIncursion(inc, members, orders, { leg: 1, atMs: legDuration(second) }, NO_TAPS)
    expect(late.earned.money).toBe(2 * MONEY)
  })
})

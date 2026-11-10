import { describe, expect, it } from 'vitest'
import { RoomKind } from '../../data/incursions'
import { IncursionPhase, type IncursionProgress } from './activeIncursion'
import { partyDamage } from './damageTally'
import { EventKind } from './events'
import { battleRoom, member, NO_TAPS, testIncursion, weakFoe } from './incursion-test-utils'
import { simulateIncursion } from './incursionRun'
import { legDuration } from './incursionTimeline'

const inc = testIncursion([battleRoom([weakFoe(), weakFoe()]), { kind: RoomKind.Regroup, name: '' }, battleRoom([weakFoe(), weakFoe()])])
const members = [member('a'), member('b')]
const record = simulateIncursion(inc, members, [{ seed: 1, moves: {}, turns: [] }, { seed: 2, moves: {}, turns: [] }], null, NO_TAPS)

const progress = (leg: number, legMs: number): IncursionProgress => ({ phase: IncursionPhase.Playing, record, leg, legMs, regroupMsLeft: 0, tap: null })

/** Daño de los golpes de `id` en los tramos dados, contado a mano */
const hitsBy = (id: string, legs: number) =>
  record.legs
    .slice(0, legs)
    .flatMap((l) => l.events)
    .filter((e) => e.kind === EventKind.Hit && e.actor === id)
    .reduce((sum, e) => sum + (e.amount ?? 0), 0)

const damageOf = (p: IncursionProgress, id: string) => partyDamage(p).find((l) => l.id === id)?.damage

describe('recuento de daño de la incursión', () => {
  it('suma los golpes de cada uno en todos los combates', () => {
    const end = progress(1, legDuration(record.legs[1]))
    expect(damageOf(end, 'a')).toBe(hitsBy('a', 2))
    expect(damageOf(end, 'b')).toBe(hitsBy('b', 2))
    expect(hitsBy('a', 2) + hitsBy('b', 2)).toBeGreaterThan(0)
  })

  it('solo cuenta lo que ya se ha visto', () => {
    const start = progress(0, 0)
    expect(partyDamage(start).every((l) => l.damage === 0)).toBe(true)
    expect(damageOf(progress(1, 0), 'a')).toBe(hitsBy('a', 1))
  })

  it('no cuenta el daño que se hacen entre ellos (los de área que dan a todos)', () => {
    const [first, ...rest] = record.legs
    const friendlyHit = { kind: EventKind.Hit, actor: 'a', target: 'b', amount: 1000, text: '' }
    const withFriendly = { ...record, legs: [{ ...first, events: [...first.events, friendlyHit] }, ...rest] }
    const end = { ...progress(1, legDuration(record.legs[1])), record: withFriendly }
    expect(damageOf(end, 'a')).toBe(hitsBy('a', 2))
  })

  it('va de más a menos daño', () => {
    const lines = partyDamage(progress(1, legDuration(record.legs[1])))
    expect(lines.map((l) => l.id).sort()).toEqual(['a', 'b'])
    expect(lines[0].damage).toBeGreaterThanOrEqual(lines[1].damage)
  })
})

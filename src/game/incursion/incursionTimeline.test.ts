import { describe, expect, it } from 'vitest'
import { battleRoom, member, NO_TAPS, testIncursion, weakFoe } from './incursion-test-utils'
import { simulateLeg } from './incursionLeg'
import { eventsStarted, INCURSION_EVENT_MS, legDuration } from './incursionTimeline'
import { INCURSION_REVIVES } from './revives'

const MONEY = 10
const inc = testIncursion([battleRoom([weakFoe()], MONEY), battleRoom([weakFoe()], MONEY)])
const leg = simulateLeg(inc, { room: 0, members: [member('a')], revives: INCURSION_REVIVES }, 1, NO_TAPS)

describe('línea de tiempo de una incursión', () => {
  it('dura lo que suman sus eventos', () => {
    expect(legDuration(leg)).toBe(leg.events.reduce((sum, e) => sum + INCURSION_EVENT_MS[e.kind], 0))
  })

  it('al empezar solo ha empezado el primer evento y al final, todos', () => {
    expect(eventsStarted(leg, 0)).toBe(1)
    expect(eventsStarted(leg, legDuration(leg))).toBe(leg.events.length)
  })
})

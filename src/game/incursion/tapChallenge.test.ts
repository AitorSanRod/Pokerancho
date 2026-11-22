import { describe, expect, it } from 'vitest'
import { area, healAlly, IMOVE, move, raise, TapKind } from '../../data/incursionMoves'
import {
  isPerfect,
  isTapScore,
  MASH_MAX_TAPS,
  MASH_MIN_TAPS,
  mashScore,
  partialGain,
  PRIORITY_RINGS,
  ringScore,
  SEQUENCE_MIN_POWER,
  SEQUENCE_RINGS,
  tapChallengeOf,
  TAP_SCORE_STEPS,
} from './tapChallenge'

const RAISE = raise([{ stat: 'atk', stages: 1 }])

describe('reto de los toques de cada ataque', () => {
  it('los de daño normales machacan; con más potencia, más toques y más mejora', () => {
    const weak = tapChallengeOf(move('a', 'A', 'normal', SEQUENCE_MIN_POWER / 3))
    const strong = tapChallengeOf(move('b', 'B', 'normal', SEQUENCE_MIN_POWER - 1))
    if (weak.kind !== TapKind.Mash || strong.kind !== TapKind.Mash) throw new Error('deberían machacar')
    expect(strong.goal).toBeGreaterThan(weak.goal)
    expect(strong.bonus).toBeGreaterThan(weak.bonus)
  })

  it('los fuertes o de área piden una secuencia de anillos; los de prioridad, los suyos', () => {
    expect(tapChallengeOf(move('a', 'A', 'normal', SEQUENCE_MIN_POWER))).toMatchObject({ kind: TapKind.Rings, ...SEQUENCE_RINGS })
    expect(tapChallengeOf(move('a', 'A', 'normal', 40, [area()]))).toMatchObject({ kind: TapKind.Rings, ...SEQUENCE_RINGS })
    expect(tapChallengeOf(move('a', 'A', 'normal', 40, [], { priority: 1 }))).toMatchObject({ kind: TapKind.Rings, ...PRIORITY_RINGS })
  })

  it('los de cura y los de estado, anillos', () => {
    expect(tapChallengeOf(move('a', 'A', 'normal', 40, [healAlly(1)])).kind).toBe(TapKind.Rings)
    expect(tapChallengeOf(move('a', 'A', 'normal', 0, [RAISE])).kind).toBe(TapKind.Rings)
  })

  it('todos los ataques del juego tienen un reto que se puede hacer', () => {
    for (const mv of Object.values(IMOVE)) {
      const ch = tapChallengeOf(mv)
      expect(ch.bonus).toBeGreaterThan(0)
      if (ch.kind === TapKind.Mash) expect(ch.goal).toBeGreaterThanOrEqual(MASH_MIN_TAPS)
      if (ch.kind === TapKind.Mash) expect(ch.goal).toBeLessThanOrEqual(MASH_MAX_TAPS)
      else expect(ch.min).toBeLessThanOrEqual(ch.max)
    }
  })

  it('machacar cuenta a saltos y sin pasar de 1: el esfuerzo a medias también vale', () => {
    expect(mashScore(0, 40)).toBe(0)
    expect(mashScore(20, 40)).toBeCloseTo(Math.floor(0.5 * TAP_SCORE_STEPS) / TAP_SCORE_STEPS)
    expect(mashScore(80, 40)).toBe(1)
    expect(ringScore(2, 3)).toBeCloseTo(2 / 3)
  })

  it('el reto entero de anillos es crítico y no suma mejora; machacar entero, la mejora entera', () => {
    const rings = { kind: TapKind.Rings, min: 1, max: 3, bonus: 0.2 } as const
    const mash = { kind: TapKind.Mash, goal: 10, bonus: 0.1 } as const
    expect(isPerfect(rings, 1)).toBe(true)
    expect(partialGain(rings, 1)).toBe(0)
    expect(partialGain(rings, 0.5)).toBeCloseTo(rings.bonus / 2)
    expect(isPerfect(mash, 1)).toBe(false)
    expect(partialGain(mash, 1)).toBe(mash.bonus)
  })

  it('el servidor solo acepta puntuaciones de 0 a 1', () => {
    expect(isTapScore(0.5)).toBe(true)
    expect(isTapScore(1.2)).toBe(false)
    expect(isTapScore('1')).toBe(false)
  })
})

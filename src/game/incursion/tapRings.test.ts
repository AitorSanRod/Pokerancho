import { describe, expect, it } from 'vitest'
import { IMOVE, TapKind } from '../../data/incursionMoves'
import { judgeRings, RING_EARLY_MS, RING_LATE_MS, ringHits, ringLayout, ringsDone, ringShowsAt, type RingSpot } from './tapRings'
import { tapChallengeOf } from './tapChallenge'
import { TAP_WINDOW_MS } from './tapWindow'

const RINGS = { kind: TapKind.Rings, min: 1, max: 3, bonus: 0.2 } as const
const spots: RingSpot[] = [
  { x: 0.2, y: 0.5, at: 1_000 },
  { x: 0.8, y: 0.5, at: 2_000 },
]

describe('anillos de la ventana de toques', () => {
  it('la misma clave da los mismos anillos, entre el mínimo y el máximo y en orden', () => {
    for (let key = 0; key < 50; key++) {
      const layout = ringLayout(RINGS, key)
      expect(ringLayout(RINGS, key)).toEqual(layout)
      expect(layout.length).toBeGreaterThanOrEqual(RINGS.min)
      expect(layout.length).toBeLessThanOrEqual(RINGS.max)
      layout.forEach((s, i) => i > 0 && expect(s.at).toBeGreaterThan(layout[i - 1].at))
    }
  })

  it('los de cualquier ataque caben en la ventana', () => {
    for (const mv of Object.values(IMOVE)) {
      const ch = tapChallengeOf(mv)
      if (ch.kind !== TapKind.Rings) continue
      for (let key = 0; key < 10; key++) for (const s of ringLayout(ch, key)) expect(s.at + RING_LATE_MS).toBeLessThan(TAP_WINDOW_MS)
    }
  })

  it('acierta cada anillo un toque encima y a tiempo, en orden', () => {
    const marks = judgeRings(spots, [{ t: 1_000, ring: 0 }, { t: 2_000 + RING_LATE_MS, ring: 1 }], 3_000)
    expect(marks).toEqual(['hit', 'hit'])
    expect(ringHits(marks)).toBe(2)
    expect(ringsDone(marks)).toBe(true)
  })

  it('falla si cae fuera, antes de tiempo o sobre otro anillo; uno sin tocar, al cerrarse', () => {
    expect(judgeRings(spots, [{ t: 1_000, ring: null }], 1_100)).toEqual(['miss', null])
    expect(judgeRings(spots, [{ t: 1_000 - RING_EARLY_MS - 1, ring: 0 }], 1_100)).toEqual(['miss', null])
    expect(judgeRings(spots, [{ t: 1_000, ring: 1 }], 1_100)).toEqual(['miss', null])
    expect(judgeRings(spots, [], 1_000 + RING_LATE_MS + 1)).toEqual(['miss', null])
    expect(ringsDone(judgeRings(spots, [], 1_100))).toBe(false)
  })

  it('tocar de más no sirve: el toque siguiente cuenta para el anillo siguiente', () => {
    const marks = judgeRings(spots, [{ t: 1_000, ring: 0 }, { t: 1_050, ring: 0 }], 1_100)
    expect(marks).toEqual(['hit', 'miss'])
  })

  it('cada anillo aparece antes de cerrarse', () => {
    expect(ringShowsAt(spots[0])).toBeLessThan(spots[0].at)
  })
})

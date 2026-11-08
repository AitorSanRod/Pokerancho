import { describe, expect, it } from 'vitest'
import { retreatPasses, votesNeeded } from './retreatVote'

describe('retirada por votación', () => {
  it.each([
    [1, 1],
    [2, 1],
    [3, 2],
    [4, 2],
    [5, 3],
  ])('con %i jugadores hacen falta %i votos', (players, needed) => {
    expect(votesNeeded(players)).toBe(needed)
    expect(retreatPasses(needed, players)).toBe(true)
    expect(retreatPasses(needed - 1, players)).toBe(false)
  })
})

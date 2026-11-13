import { describe, expect, it, vi } from 'vitest'
import { rankingWeek, nextRankingAt, RANKING_REFRESH_MS, rankingDue } from './ranking'

vi.mock('../../data/rankingCuts', () => ({ RANKING_EXTRA_CUTS: [] }))

describe('ranking', () => {
  const start = 10 * RANKING_REFRESH_MS

  it('sin foto, toca hacerla', () => {
    expect(rankingDue(null, start)).toBe(true)
  })

  it('se rehace una vez en cada hora en punto', () => {
    expect(rankingDue(start, start + RANKING_REFRESH_MS - 1)).toBe(false)
    expect(rankingDue(start + RANKING_REFRESH_MS - 1, start + RANKING_REFRESH_MS)).toBe(true)
  })

  it('la próxima foto es la siguiente hora en punto', () => {
    expect(nextRankingAt(start)).toBe(start + RANKING_REFRESH_MS)
    expect(nextRankingAt(start + 1)).toBe(start + RANKING_REFRESH_MS)
  })

  it('la semana del daño va de lunes a domingo (UTC)', () => {
    const monday = Date.UTC(2026, 10, 9)
    expect(new Date(monday).getUTCDay()).toBe(1)
    expect(rankingWeek(monday)).toBe(monday)
    expect(rankingWeek(Date.UTC(2026, 10, 15, 23, 59))).toBe(monday)
    expect(rankingWeek(Date.UTC(2026, 10, 16))).toBe(Date.UTC(2026, 10, 16))
    expect(rankingWeek(monday - 1)).toBe(Date.UTC(2026, 10, 2))
  })

  it('un corte extra empieza un periodo nuevo hasta el lunes siguiente', () => {
    const monday = Date.UTC(2026, 10, 9)
    const cut = Date.UTC(2026, 10, 13, 8)
    expect(rankingWeek(cut - 1, [cut])).toBe(monday)
    expect(rankingWeek(cut, [cut])).toBe(cut)
    expect(rankingWeek(Date.UTC(2026, 10, 15, 23, 59), [cut])).toBe(cut)
    expect(rankingWeek(Date.UTC(2026, 10, 16), [cut])).toBe(Date.UTC(2026, 10, 16))
  })
})

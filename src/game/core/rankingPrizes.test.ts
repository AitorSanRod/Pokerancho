import { describe, expect, it, vi } from 'vitest'
import { RANKING_PRIZES, WeeklyBoard } from '../../data/rankingPrizes'
import { parseServerGifts } from '../collection/serverGifts'
import { RANKING_WEEK_MS, rankingWeek } from './ranking'
import { prizedWeek, prizeForRank, rankingPrizeGift } from './rankingPrizes'

vi.mock('../../data/rankingCuts', () => ({ RANKING_EXTRA_CUTS: [] }))

const USER = '8ef5a769-cc35-4c7e-8ece-e4125a920813'
const NOW = Date.UTC(2026, 10, 16, 0, 1)

describe('premios semanales del ranking', () => {
  it('se premia la semana que acaba de terminar', () => {
    expect(prizedWeek(NOW)).toBe(rankingWeek(NOW) - RANKING_WEEK_MS)
    expect(rankingWeek(prizedWeek(NOW))).toBe(prizedWeek(NOW))
  })

  it('con un corte extra se premia lo que llevaba la semana al cortar y, el lunes, lo que va del corte al lunes', () => {
    const monday = rankingWeek(NOW) - RANKING_WEEK_MS
    const cut = monday + RANKING_WEEK_MS / 2
    expect(prizedWeek(cut, [cut])).toBe(monday)
    expect(prizedWeek(NOW, [cut])).toBe(cut)
  })

  it('el podio tiene su premio y todos los demás, el de participación', () => {
    const { podium, rest } = RANKING_PRIZES[WeeklyBoard.Tower]
    podium.forEach((prize, i) => expect(prizeForRank(WeeklyBoard.Tower, i + 1)).toBe(prize))
    expect(prizeForRank(WeeklyBoard.Tower, podium.length + 1)).toBe(rest)
    expect(prizeForRank(WeeklyBoard.Tower, podium.length + 50)).toBe(rest)
  })

  it('cada premio es un regalo del servidor válido, distinto por ranking, semana y cuenta', () => {
    const week = prizedWeek(NOW)
    const gift = rankingPrizeGift(WeeklyBoard.Damage, week, USER, 1, NOW)
    const [parsed] = parseServerGifts([{ id: gift.id, title: gift.title, ...gift.goods }])
    expect(parsed).toMatchObject({ id: gift.id, ...prizeForRank(WeeklyBoard.Damage, 1) })
    expect(gift.expiresAt).toBeGreaterThan(NOW)
    const others = [
      rankingPrizeGift(WeeklyBoard.Tower, week, USER, 1, NOW),
      rankingPrizeGift(WeeklyBoard.Damage, week - RANKING_WEEK_MS, USER, 1, NOW),
      rankingPrizeGift(WeeklyBoard.Damage, week, USER.replace('8', '9'), 1, NOW),
    ]
    expect(new Set([gift.id, ...others.map((g) => g.id)]).size).toBe(others.length + 1)
  })
})

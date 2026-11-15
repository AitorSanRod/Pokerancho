import { describe, expect, it } from 'vitest'
import { RANKING_WEEK_MS } from '../core/ranking'
import { initialState } from '../core/state'
import { recordWeekFloor, towerWeekBest } from './towerWeek'

const NOW = Date.UTC(2026, 5, 10, 12)

describe('récord semanal de la torre', () => {
  it('guarda el piso más alto de la semana y no baja con uno peor', () => {
    const s = initialState()
    s.lastTick = NOW
    recordWeekFloor(s, 12)
    recordWeekFloor(s, 7)
    expect(towerWeekBest(s, NOW)).toBe(12)
  })

  it('la semana siguiente empieza de cero', () => {
    const s = initialState()
    s.lastTick = NOW
    recordWeekFloor(s, 12)
    expect(towerWeekBest(s, NOW + RANKING_WEEK_MS)).toBe(0)
    s.lastTick = NOW + RANKING_WEEK_MS
    recordWeekFloor(s, 3)
    expect(towerWeekBest(s, s.lastTick)).toBe(3)
  })
})

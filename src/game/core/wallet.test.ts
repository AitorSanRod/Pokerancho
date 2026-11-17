import { describe, expect, it } from 'vitest'
import { DAILY_MISSIONS, MissionKind } from '../../data/dailyMissions'
import { initialState } from './state'
import { holdMoney, releaseMoney } from './wallet'

const spendMission = () => ({
  kind: MissionKind.SpendMoney,
  goal: 1000,
  progress: 0,
  claimed: false,
  reward: DAILY_MISSIONS[0].reward,
  routeId: null,
  speciesId: null,
})

describe('dinero retenido', () => {
  it('retener una fianza baja el dinero pero no cuenta como gastado', () => {
    const s = initialState()
    s.money = 500
    s.missions = { day: 'hoy', list: [spendMission()] }
    expect(holdMoney(s, 200)).toBe(200)
    expect(s.money).toBe(300)
    expect(s.missions.list[0].progress).toBe(0)
  })

  it('no retiene más de lo que tiene', () => {
    const s = initialState()
    s.money = 50
    expect(holdMoney(s, 200)).toBe(50)
    expect(s.money).toBe(0)
  })

  it('devolver suma lo retenido', () => {
    const s = initialState()
    s.money = 10
    releaseMoney(s, 90)
    expect(s.money).toBe(100)
  })
})

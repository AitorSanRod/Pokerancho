import { describe, expect, it } from 'vitest'
import { RAID_BOSSES } from '../../data/raidBosses'
import { seqRng } from '../core/test-utils'
import { initialState } from '../core/state'
import { applyPrize, collectRaidPrize, fightPrize, RAID_FIGHT_EXP_PER_LEVEL, rollPrize } from './raidPrizes'

const BOSS = RAID_BOSSES[0]
/** Con 0 sale todo lo de la tabla (cada línea se tira con rng() < probabilidad) */
const ALL = seqRng(0)

describe('premio de la pestaña Raids', () => {
  it('con todo el jefe quitado: la tabla entera más la EXP de la pelea', () => {
    const full = rollPrize(BOSS, 'u', ALL)
    const prize = fightPrize(BOSS, 'u', 1, ALL)
    expect(prize.money).toBe(full.money)
    expect(prize.exp).toBe(full.exp + BOSS.level * RAID_FIGHT_EXP_PER_LEVEL)
  })

  it('va por la parte del jefe que se le quitó', () => {
    const prize = fightPrize(BOSS, 'u', 0.5, ALL)
    const full = fightPrize(BOSS, 'u', 1, ALL)
    expect(prize.money).toBe(Math.round(full.money * 0.5))
    expect(prize.tickets).toBe(Math.floor(full.tickets * 0.5))
  })

  it('sin quitarle nada, no hay premio', () => {
    expect(fightPrize(BOSS, 'u', 0, ALL)).toMatchObject({ money: 0, tickets: 0, pieces: 0, exp: 0 })
  })

  it('en Notificaciones se recoge uno a uno', () => {
    const s = initialState()
    const prize = fightPrize(BOSS, 'u', 1, ALL)
    s.raidPrizes = [prize]
    const money = s.money
    expect(collectRaidPrize(s, 0)).toEqual(prize)
    expect(s.raidPrizes).toEqual([])
    expect(s.money).toBe(money + prize.money)
    expect(applyPrize(initialState(), prize)).toBe(0)
  })
})

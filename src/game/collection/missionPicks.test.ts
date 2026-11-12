import { describe, expect, it, vi } from 'vitest'
import { DAILY_MISSIONS, MISSIONS_PER_DAY, MissionKind } from '../../data/dailyMissions'
import { POKEMON } from '../../data/pokemon'
import { initialState } from '../core/state'
import { chooseStarter, seqRng } from '../core/test-utils'
import { companionChoices, refreshMissions } from './missionPicks'
import { dayKey } from './missions'
import { PIECES_PER_COMBINE } from './pieces'
import { markSeen } from './dex'

vi.mock('../../data/maps/kantoMaps', () => import('../core/test-map'))

const DAY = 24 * 60 * 60 * 1000
const NOW = new Date(2026, 0, 10, 12).getTime()

function player() {
  const s = initialState()
  chooseStarter(s, POKEMON.Charmander)
  return s
}

describe('refreshMissions', () => {
  it('no hay misiones durante el tutorial', () => {
    const s = initialState()
    refreshMissions(s, NOW)
    expect(s.missions).toBeNull()
  })

  it('saca misiones distintas del día, como mucho las del día', () => {
    const s = player()
    refreshMissions(s, NOW, seqRng(0.3, 0.7, 0.1))
    const kinds = s.missions!.list.map((m) => m.kind)
    expect(s.missions!.day).toBe(dayKey(NOW))
    expect(kinds.length).toBeLessThanOrEqual(Math.min(MISSIONS_PER_DAY, DAILY_MISSIONS.length))
    expect(new Set(kinds).size).toBe(kinds.length)
  })

  it('el mismo día las conserva; al día siguiente salen otras', () => {
    const s = player()
    refreshMissions(s, NOW)
    s.missions!.list[0].progress = 1
    refreshMissions(s, NOW + 1000)
    expect(s.missions!.list[0].progress).toBe(1)
    refreshMissions(s, NOW + DAY)
    expect(s.missions!.day).toBe(dayKey(NOW + DAY))
    expect(s.missions!.list.every((m) => m.progress === 0)).toBe(true)
  })

  it('sin rutas para expediciones no pide recoger expediciones', () => {
    for (let i = 0; i < 20; i++) {
      const s = player()
      refreshMissions(s, NOW, seqRng(i / 20, 0.5, (i * 7) % 20 / 20))
      expect(s.missions!.list.some((m) => m.kind === MissionKind.FinishExpeditions)).toBe(false)
    }
  })
})

describe('companionChoices', () => {
  it('las especies que tiene y las que puede crear ya, no las demás', () => {
    const s = player()
    markSeen(s, POKEMON.Bulbasaur)
    markSeen(s, POKEMON.Squirtle)
    s.pieces[POKEMON.Bulbasaur] = PIECES_PER_COMBINE
    s.pieces[POKEMON.Squirtle] = PIECES_PER_COMBINE - 1
    expect(companionChoices(s).sort()).toEqual([POKEMON.Charmander, POKEMON.Bulbasaur].sort())
  })
})

import { describe, expect, it, vi } from 'vitest'
import { giftContents } from '../../data/dailyGifts'
import { DAILY_MISSIONS, MissionKind } from '../../data/dailyMissions'
import { route, RouteId } from '../../data/maps'
import { POKEMON } from '../../data/pokemon'
import { initialState } from '../core/state'
import { chooseStarter } from '../core/test-utils'
import { spendMoney } from '../core/wallet'
import { completeRoute } from '../run/runBattle'
import { startRun } from '../run/run'
import { advanceMission, claimableMissions, claimMission, dayKey, salvageMissions, type Mission } from './missions'

vi.mock('../../data/maps/kantoMaps', () => import('../core/test-map'))

const REWARD = giftContents({ money: 123, tickets: 2 })

const mission = (kind: Mission['kind'], goal: number, extra: Partial<Mission> = {}): Mission => ({
  kind,
  goal,
  progress: 0,
  claimed: false,
  reward: REWARD,
  routeId: null,
  speciesId: null,
  ...extra,
})

function withMissions(...list: Mission[]) {
  const s = initialState()
  chooseStarter(s, POKEMON.Charmander)
  s.missions = { day: dayKey(Date.now()), list }
  return s
}

describe('advanceMission', () => {
  it('avanza solo las de esa clase y sin pasar del objetivo', () => {
    const s = withMissions(mission(MissionKind.PullGacha, 3), mission(MissionKind.WinBattles, 3))
    advanceMission(s, MissionKind.PullGacha, 5)
    expect(s.missions!.list.map((m) => m.progress)).toEqual([3, 0])
  })

  it('la de una ruta concreta solo avanza con esa ruta', () => {
    const s = withMissions(mission(MissionKind.CompleteRoute, 1, { routeId: RouteId.Ruta1 }))
    advanceMission(s, MissionKind.CompleteRoute, 1, { routeId: RouteId.PuebloPaleta })
    expect(s.missions!.list[0].progress).toBe(0)
    advanceMission(s, MissionKind.CompleteRoute, 1, { routeId: RouteId.Ruta1 })
    expect(s.missions!.list[0].progress).toBe(1)
  })

  it('gastar dinero cuenta para la de gastar', () => {
    const s = withMissions(mission(MissionKind.SpendMoney, 1000))
    s.money = 500
    spendMoney(s, 200)
    expect(s.money).toBe(300)
    expect(s.missions!.list[0].progress).toBe(200)
  })

  it('completar una ruta cuenta para las tres misiones de rutas', () => {
    const s = withMissions(
      mission(MissionKind.CompleteRoutes, 2),
      mission(MissionKind.CompleteRoute, 1, { routeId: RouteId.PuebloPaleta }),
      mission(MissionKind.CompleteRouteWith, 1, { speciesId: POKEMON.Charmander }),
    )
    startRun(s, RouteId.PuebloPaleta)
    completeRoute(s, route(RouteId.PuebloPaleta))
    expect(s.missions!.list.map((m) => m.progress)).toEqual([1, 1, 1])
  })
})

describe('claimMission', () => {
  it('cobra una vez la cumplida y da su premio', () => {
    const s = withMissions(mission(MissionKind.CreateMons, 1, { progress: 1 }))
    const money = s.money
    expect(claimableMissions(s)).toBe(1)
    expect(claimMission(s, 0)).toEqual(REWARD)
    expect(s.money).toBe(money + REWARD.money)
    expect(claimMission(s, 0)).toBeNull()
    expect(claimableMissions(s)).toBe(0)
  })

  it('no cobra la que no está cumplida', () => {
    const s = withMissions(mission(MissionKind.CreateMons, 2, { progress: 1 }))
    expect(claimMission(s, 0)).toBeNull()
  })
})

describe('salvageMissions', () => {
  it('rescata las misiones guardadas', () => {
    const saved = { day: '2026-01-01', list: [mission(DAILY_MISSIONS[0].kind, 5, { progress: 2 })] }
    expect(salvageMissions(JSON.parse(JSON.stringify(saved)))).toEqual(saved)
  })

  it('si algo no encaja, ninguna', () => {
    expect(salvageMissions({ day: '2026-01-01', list: [{ kind: 'nada' }] })).toBeNull()
    expect(salvageMissions(null)).toBeNull()
  })
})

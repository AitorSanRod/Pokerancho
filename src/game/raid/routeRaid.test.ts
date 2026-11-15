import { describe, expect, it, vi } from 'vitest'
import { NodeKind, route, RouteId } from '../../data/maps'
import { POKEMON } from '../../data/pokemon'
import { seqRng } from '../core/test-utils'
import { initialState } from '../core/state'
import { startRun } from '../run/run'
import { createMon } from '../team/mons'
import { rollPrize } from './raidPrizes'
import { winRouteRaid } from './routeRaid'
import { ROUTE_RAID_REPEAT_MONEY_MULT } from './routeRaidStreak'

vi.mock('../../data/maps/kantoMaps', () => import('../core/test-map'))

const R = route(RouteId.BosqueVerde)
const RAID = R.nodes.find((n) => n.kind === NodeKind.Raid)!

function onRoute() {
  const s = initialState()
  s.tutorial = null
  const mon = createMon(POKEMON.Snorlax, 30, 0)
  s.owned.push(mon)
  s.activeUid = mon.uid
  s.unlockedRoutes.push(R.id)
  startRun(s, R.id)
  return s
}

const prizeMoney = () => rollPrize({ speciesId: RAID.boss!.speciesId, level: RAID.boss!.level, tier: RAID.boss!.tier! }, 'x', seqRng(0)).money

describe('jefe comunitario de una parada', () => {
  it('al vencerlo, su premio de raid va a lo ganado en la ruta', () => {
    const s = onRoute()
    winRouteRaid(s, R, RAID, 0, seqRng(0))
    expect(s.run!.earned.raidBosses).toEqual([RAID.boss!.speciesId])
    expect(s.run!.earned.money).toBe(prizeMoney())
  })

  it('repetirlo seguido da menos dinero', () => {
    const s = onRoute()
    winRouteRaid(s, R, RAID, 0, seqRng(0))
    winRouteRaid(s, R, RAID, 1, seqRng(0))
    expect(s.run!.earned.money).toBe(prizeMoney() + Math.round(prizeMoney() * ROUTE_RAID_REPEAT_MONEY_MULT))
    expect(s.run!.earned.raidMoneyMult).toBe(ROUTE_RAID_REPEAT_MONEY_MULT)
  })
})

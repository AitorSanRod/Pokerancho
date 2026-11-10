import { describe, expect, it, vi } from 'vitest'
import { NodeKind, route, RouteId } from '../../data/maps'
import { seededRng } from '../core/random'
import { advanceStopRoom, ROUTE_RAID_BOTS, stopRoom } from './stopRoom'
import { presentMembers, RaidMemberKind, type Raid } from './raidRoom'
import type { RoomHooks } from './raidEngine'

vi.mock('../../data/maps/kantoMaps', () => import('../core/test-map'))

const ROUTE = route(RouteId.BosqueVerde)
const RAID_NODE = ROUTE.nodes.find((n) => n.kind === NodeKind.Raid)!
const PLACE = { routeId: ROUTE.id, nodeId: RAID_NODE.id }
const HOOKS: RoomHooks = { passivesOf: () => [], beforeRound: () => {} }
/** Tiempo de sobra para que, al ritmo de los bots, la sala se llene si pudiera */
const LONG_MS = 60 * 60 * 1000

const botCount = (raid: Raid) => presentMembers(raid).filter((m) => m.kind === RaidMemberKind.Bot).length

describe('bots de la sala de una parada', () => {
  it(`en una sala en marcha nunca hay más de ${ROUTE_RAID_BOTS.max}`, () => {
    for (let seed = 0; seed < 50; seed++) {
      const raid = stopRoom(RAID_NODE, PLACE, 0.9, seededRng(seed), () => [])
      expect(botCount(raid)).toBeLessThanOrEqual(ROUTE_RAID_BOTS.max)
    }
  })

  it(`al ir llegando no pasan de ${ROUTE_RAID_BOTS.max}`, () => {
    const rng = seededRng(1)
    const raid = stopRoom(RAID_NODE, PLACE, null, rng, () => [])
    raid.hp = raid.maxHp = Number.MAX_SAFE_INTEGER
    advanceStopRoom(raid, LONG_MS, rng, HOOKS)
    expect(botCount(raid)).toBe(ROUTE_RAID_BOTS.max)
  })
})

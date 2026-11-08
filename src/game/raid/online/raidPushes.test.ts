import { describe, expect, it, vi } from 'vitest'
import { PushTopic } from '../../core/push'
import { seqRng } from '../../core/test-utils'
import { RAID_ROUND_MS } from '../raidCombat'
import { presentMembers } from '../raidRoom'
import { player, rng, seatPlayers, stopChannel, T0, tabRoom } from './online-test-utils'
import { markRoom, roomPushes } from './raidPushes'
import { catchUp, createRoom, type SharedRoom } from './sharedRoom'

vi.mock('../../../data/maps/kantoMaps', () => import('../../core/test-map'))

const spend = (room: SharedRoom, i: number) => Object.assign(room.raid.members[i], { lives: 0, left: true })

const targets = (pushes: ReturnType<typeof roomPushes>) => pushes.map((p) => (p.to === 'all' ? 'all' : p.to.playerIds))

describe('avisos de una sala', () => {
  it('sin cambios no avisa de nada', () => {
    const room = tabRoom()
    seatPlayers(room, 2)
    expect(roomPushes(room, markRoom(room), T0)).toEqual([])
  })

  it('avisa solo al dueño del Pokémon que acaba de gastar sus vidas', () => {
    const room = tabRoom()
    seatPlayers(room, 2)
    const mark = markRoom(room)
    spend(room, 1)
    const pushes = roomPushes(room, mark, T0)
    expect(targets(pushes)).toEqual([[player(1)]])
    expect(pushes[0].job).toMatchObject({ topic: PushTopic.Raid, dueAt: T0 })
  })

  it('no repite el aviso de quien ya había gastado sus vidas', () => {
    const room = tabRoom()
    seatPlayers(room, 2)
    spend(room, 0)
    expect(roomPushes(room, markRoom(room), T0)).toEqual([])
  })

  it('al caer el jefe avisa a los que siguen dentro, y no a quien acaba de gastar sus vidas', () => {
    const room = createRoom(stopChannel(), 'stop', T0, null, rng)
    seatPlayers(room, 3)
    const mark = markRoom(room)
    spend(room, 0)
    room.raid.hp = 0
    const pushes = roomPushes(room, mark, T0)
    expect(targets(pushes)).toEqual([[player(0)], [player(1), player(2)]])
    expect(new Set(pushes.map((p) => p.job.key)).size).toBe(pushes.length)
  })

  it('el aviso de vidas gastadas sale al poner la sala al día', () => {
    const room = createRoom(stopChannel(), 'stop', T0, null, rng)
    seatPlayers(room, 2)
    Object.assign(presentMembers(room.raid)[0], { lives: 1, hpFraction: Number.MIN_VALUE })
    room.raid.hp = room.raid.maxHp = Number.MAX_SAFE_INTEGER
    const mark = markRoom(room)
    // Con 0 el jefe pega al primero que está en pie
    catchUp(room, T0 + 10 * RAID_ROUND_MS, seqRng(0))
    expect(targets(roomPushes(room, mark, T0))).toEqual([[player(0)]])
  })
})

import { describe, expect, it } from 'vitest'
import { RoomKind } from '../../data/incursions'
import { IncursionPhase } from '../incursion/activeIncursion'
import { legDuration } from '../incursion/incursionTimeline'
import { settleGroupTaps } from '../incursion/tapSettle'
import { noTurnOrders } from '../incursion/tapWindow'
import { RaidRotation } from './online/protocol'
import { entrant } from './raid-test-utils'
import { bossShareTaken, fightProgress, RAID_REVIVES, raidSource } from './raidFight'
import { startFight } from './raidLobby'
import { newRoom, roomBoss, seatEntrant } from './raidRoom'
import { cycleEnd, RAID_FIGHT_MS } from './raidSchedule'

const CYCLE = 4

/** Una sala con un jugador cuya pelea se ha jugado entera sin que nadie toque */
function playedRoom() {
  const room = newRoom('sala', RaidRotation.Ordered, CYCLE, 321)
  seatEntrant(room, entrant('a', roomBoss(room).level))
  startFight(room)
  settleGroupTaps(room.fight!, raidSource(roomBoss(room)), cycleEnd(CYCLE) * 2, 0, noTurnOrders())
  return room
}

describe('pelea contra el jefe', () => {
  it('es una sala de combate con el jefe y los revivires de la sala, y para antes de que acabe la media hora', () => {
    const src = raidSource(roomBoss({ rotation: RaidRotation.Ordered, cycle: CYCLE }))
    expect(src.rooms).toHaveLength(1)
    const room = src.rooms[0]
    expect(room.kind).toBe(RoomKind.Battle)
    expect(room.kind === RoomKind.Battle && room.foes).toHaveLength(1)
    expect(src.revives).toBe(RAID_REVIVES)
    expect(src.timeLimitMs).toBeLessThan(RAID_FIGHT_MS)
  })

  it('termina dentro de su ciclo y se sabe qué parte del jefe se le ha quitado', () => {
    const room = playedRoom()
    const fight = room.fight!
    const p = fightProgress(fight, roomBoss(room), cycleEnd(CYCLE))
    expect(p.phase).toBe(IncursionPhase.Finished)
    expect(fight.legStarts[0] + legDuration(p.record.legs[0])).toBeLessThanOrEqual(cycleEnd(CYCLE))
    const share = bossShareTaken(p)
    expect(share).toBeGreaterThan(0)
    expect(share).toBeLessThanOrEqual(1)
  })
})

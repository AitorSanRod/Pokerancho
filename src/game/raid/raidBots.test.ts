import { describe, expect, it } from 'vitest'
import { isBot } from '../incursion/party'
import { RaidRotation } from './online/protocol'
import { botsArrived, RAID_BOT_EVERY_MS, roomBots, shownBots } from './raidBots'
import { newRoom, RAID_ROOM_SIZE, roomBoss, seatEntrant } from './raidRoom'
import { fightStart, lobbyStart } from './raidSchedule'
import { entrant } from './raid-test-utils'

const CYCLE = 5
const room = () => newRoom('sala', RaidRotation.Ordered, CYCLE, 1234)

describe('bots de la sala', () => {
  it('salen siempre los mismos de la semilla, con nivel por debajo del jefe', () => {
    const boss = roomBoss(room())
    const bots = roomBots(boss, 1234)
    expect(bots).toHaveLength(RAID_ROOM_SIZE)
    expect(roomBots(boss, 1234)).toEqual(bots)
    for (const b of bots) {
      expect(isBot(b.id)).toBe(true)
      expect(b.level).toBeLessThan(boss.level)
    }
  })

  it('llegan uno al abrir y uno más cada rato hasta llenar la sala al empezar la pelea', () => {
    expect(botsArrived(CYCLE, lobbyStart(CYCLE))).toBe(1)
    expect(botsArrived(CYCLE, lobbyStart(CYCLE) + RAID_BOT_EVERY_MS)).toBe(2)
    expect(botsArrived(CYCLE, fightStart(CYCLE))).toBe(RAID_ROOM_SIZE)
  })

  it('cada jugador ocupa el sitio de un bot', () => {
    const r = room()
    const now = fightStart(CYCLE) - 1
    const before = shownBots(r, now).length
    seatEntrant(r, entrant('a'))
    expect(shownBots(r, now)).toHaveLength(Math.min(before, RAID_ROOM_SIZE - 1))
  })
})

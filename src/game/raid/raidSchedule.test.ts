import { describe, expect, it } from 'vitest'
import { cycleAt, cycleEnd, fightStart, lobbyStart, RAID_CYCLE_MS, RAID_FIGHT_MS, RAID_LOBBY_MS, RaidStage, stageAt } from './raidSchedule'

describe('calendario de los jefes', () => {
  it('cada ciclo es la sala abierta y después la pelea', () => {
    expect(RAID_CYCLE_MS).toBe(RAID_LOBBY_MS + RAID_FIGHT_MS)
    expect(fightStart(3) - lobbyStart(3)).toBe(RAID_LOBBY_MS)
    expect(cycleEnd(3)).toBe(lobbyStart(4))
  })

  it('una hora cae en su ciclo y en su parte', () => {
    const cycle = 7
    expect(cycleAt(lobbyStart(cycle))).toBe(cycle)
    expect(cycleAt(cycleEnd(cycle) - 1)).toBe(cycle)
    expect(stageAt(cycle, fightStart(cycle) - 1)).toBe(RaidStage.Lobby)
    expect(stageAt(cycle, fightStart(cycle))).toBe(RaidStage.Fight)
  })
})

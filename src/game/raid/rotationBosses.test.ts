import { describe, expect, it } from 'vitest'
import { RAID_BOSSES, HARD_RAID_STAT_MULT } from '../../data/raidBosses'
import { RaidRotation } from './online/protocol'
import { cycleBoss, cycleBossIndex, rotationBosses } from './rotationBosses'

const CYCLES = Array.from({ length: 60 }, (_, i) => i)

describe('jefe de cada ciclo', () => {
  it('la rotación ordenada sigue la lista y vuelve a empezar', () => {
    for (const c of CYCLES) expect(cycleBoss(RaidRotation.Ordered, c)).toBe(RAID_BOSSES[c % RAID_BOSSES.length])
  })

  it('la difícil lleva sus stats subidas', () => {
    for (const boss of rotationBosses(RaidRotation.Hard)) expect(boss.statMult).toBeGreaterThanOrEqual(HARD_RAID_STAT_MULT)
  })

  it('la difícil sale siempre igual para el mismo ciclo y no repite la especie de la ordenada', () => {
    const hard = rotationBosses(RaidRotation.Hard)
    for (const c of CYCLES) {
      const index = cycleBossIndex(RaidRotation.Hard, c)
      expect(index).toBe(cycleBossIndex(RaidRotation.Hard, c))
      expect(index).toBeGreaterThanOrEqual(0)
      expect(index).toBeLessThan(hard.length)
      if (hard.length > 1) expect(hard[index].speciesId).not.toBe(cycleBoss(RaidRotation.Ordered, c).speciesId)
    }
  })
})

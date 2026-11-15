import { describe, expect, it } from 'vitest'
import { HARD_RAID_BOSSES, HARD_RAID_STAT_MULT, RAID_BOSSES } from '../../data/raidBosses'
import { RaidRotation } from './online/protocol'
import { rotationBoss, rotationBosses } from './rotationBosses'

describe('jefes de cada rotación', () => {
  it('la ordenada es la lista de siempre; la difícil, con sus stats multiplicadas', () => {
    expect(rotationBosses(RaidRotation.Ordered)).toBe(RAID_BOSSES)
    rotationBosses(RaidRotation.Hard).forEach((boss, i) => expect(boss.statMult).toBeCloseTo((HARD_RAID_BOSSES[i].statMult ?? 1) * HARD_RAID_STAT_MULT))
  })

  it('pasado el final de la lista vuelve a empezar', () => {
    expect(rotationBoss(RaidRotation.Ordered, RAID_BOSSES.length)).toBe(RAID_BOSSES[0])
  })
})

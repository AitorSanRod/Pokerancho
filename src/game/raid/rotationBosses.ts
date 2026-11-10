import { HARD_RAID_BOSSES, HARD_RAID_STAT_MULT, RAID_BOSSES, type RaidBoss } from '../../data/raidBosses'
import { RaidRotation } from './online/protocol'

/** La lista de jefes de cada rotación de la pestaña Raids; los de «Difíciles», con sus stats ×HARD_RAID_STAT_MULT */
const ROTATION_BOSSES: Record<RaidRotation, RaidBoss[]> = {
  [RaidRotation.Ordered]: RAID_BOSSES,
  [RaidRotation.Hard]: HARD_RAID_BOSSES.map((boss) => ({ ...boss, statMult: (boss.statMult ?? 1) * HARD_RAID_STAT_MULT })),
}

export const rotationBosses = (rotation: RaidRotation): RaidBoss[] => ROTATION_BOSSES[rotation]

/** El jefe de la posición `index` de la lista de la rotación (con módulo, por si la lista se acorta) */
export function rotationBoss(rotation: RaidRotation, index: number): RaidBoss {
  const bosses = rotationBosses(rotation)
  return bosses[index % bosses.length]
}

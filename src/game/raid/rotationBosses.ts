import { HARD_RAID_BOSSES, HARD_RAID_STAT_MULT, RAID_BOSSES, type RaidBoss } from '../../data/raidBosses'
import { seededRng } from '../core/random'
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

/** Semilla de la tirada de la rotación difícil en un ciclo: la misma en todos los móviles y en el servidor */
const HARD_SEED_SALT = 7919

/** Posición del jefe difícil de un ciclo, al azar (con semilla) sin mirar a los de los demás ciclos */
const rawHardIndex = (cycle: number): number => Math.floor(seededRng(cycle * HARD_SEED_SALT + 1)() * rotationBosses(RaidRotation.Hard).length)

/**
 * Posición en la lista de su rotación del jefe del ciclo `cycle`: la ordenada va en orden; la difícil, al azar, sin
 * repetir la especie del jefe ordenado del mismo ciclo ni el jefe del ciclo anterior (si hay otro al que cambiar)
 */
export function cycleBossIndex(rotation: RaidRotation, cycle: number): number {
  if (rotation === RaidRotation.Ordered) return cycle % RAID_BOSSES.length
  const hard = rotationBosses(RaidRotation.Hard)
  const ordered = rotationBoss(RaidRotation.Ordered, cycle).speciesId
  const banned = (i: number) => hard[i].speciesId === ordered || i === rawHardIndex(cycle - 1)
  const start = rawHardIndex(cycle)
  const offset = hard.findIndex((_, k) => !banned((start + k) % hard.length))
  return (start + Math.max(0, offset)) % hard.length
}

/** El jefe del ciclo `cycle` de la rotación */
export const cycleBoss = (rotation: RaidRotation, cycle: number): RaidBoss => rotationBoss(rotation, cycleBossIndex(rotation, cycle))

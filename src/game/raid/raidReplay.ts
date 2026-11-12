import { RAID_ROUND_MS } from './raidCombat'
import { BOSS_ID, type Raid, type RaidHit } from './raidRoom'

// Cómo se ve cada ronda: los golpes de la última ronda se juegan de una vez en el motor y aquí se reparten en orden a
// lo largo de la ronda siguiente, con el del jefe a mitad y el daño de sus estados al final. El toque crítico
// (raidCrit.ts) usa el momento del golpe del jugador.

/** Golpe de la última ronda con su turno: `seq` es único y crece golpe a golpe, `at` el ms de la ronda en que se ve */
export interface ReplayHit extends RaidHit {
  seq: number
  at: number
}

export function replayHits(raid: Raid): ReplayHit[] {
  const party = raid.lastRound.filter((h) => h.from !== BOSS_ID && !h.status)
  const boss = raid.lastRound.filter((h) => h.from === BOSS_ID)
  const statuses = raid.lastRound.filter((h) => h.status)
  const half = Math.ceil(party.length / 2)
  const ordered = [...party.slice(0, half), ...boss, ...party.slice(half), ...statuses]
  return ordered.map((h, i) => ({ ...h, seq: raid.round * 100 + i, at: (i * RAID_ROUND_MS) / ordered.length }))
}

/** Milisegundos de juego que lleva la ronda que se está viendo */
export const elapsedInRound = (raid: Raid): number => RAID_ROUND_MS - raid.roundMsLeft

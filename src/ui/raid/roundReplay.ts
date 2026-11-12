import { elapsedInRound, replayHits, type ReplayHit } from '../../game/raid/raidReplay'
import { BOSS_ID, type Raid } from '../../game/raid/raidRoom'

export type { ReplayHit }

/** Milisegundos reales que se ve cada golpe (embestida, temblor y número) */
const HIT_VISIBLE_MS = 700

/** Golpes que se están viendo ahora (a mucha velocidad de juego, varios a la vez) */
export function visibleHits(raid: Raid, timeScale: number): ReplayHit[] {
  const elapsed = elapsedInRound(raid)
  const visibleFor = HIT_VISIBLE_MS * timeScale
  return replayHits(raid).filter((h) => elapsed >= h.at && elapsed < h.at + visibleFor)
}

/** Vida del jefe que se ve: la de ahora más el daño de los golpes de la ronda que aún no han salido */
export function shownBossHp(raid: Raid): number {
  const elapsed = elapsedInRound(raid)
  const pending = replayHits(raid).filter((h) => h.to === BOSS_ID && h.at > elapsed)
  return Math.min(raid.maxHp, raid.hp + pending.reduce((sum, h) => sum + h.dealt, 0))
}

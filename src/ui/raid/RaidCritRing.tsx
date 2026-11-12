import { CRIT_RING_MS, judgeRing } from '../../game/battle/critTiming'
import { RAID_CRIT_GUARD_MS, raidRingAt } from '../../game/raid/raidCrit'
import { elapsedInRound } from '../../game/raid/raidReplay'
import type { Raid } from '../../game/raid/raidRoom'
import { RING_LOOKAHEAD_MS, TapRing } from '../shared/TapRing'

/**
 * Anillo del toque crítico sobre el jefe, si el golpe del jugador de esta ronda lo lleva: se cierra cuando se ve el
 * golpe. Los tiempos de la sala son de juego: con `timeScale` todo va más deprisa
 */
export function RaidCritRing({ raid, lastTick, timeScale }: { raid: Raid; lastTick: number; timeScale: number }) {
  const elapsed = elapsedInRound(raid)
  // Se busca un poco por delante: el anillo puede empezar entre este tick y el siguiente
  const hit = raidRingAt(raid, elapsed) ?? raidRingAt(raid, elapsed + RING_LOOKAHEAD_MS * timeScale)
  if (!hit) return null
  const taps = raid.crit?.round === raid.round ? raid.crit.taps : []
  return (
    <TapRing
      key={hit.seq}
      durationMs={CRIT_RING_MS / timeScale}
      startsInMs={(hit.at - CRIT_RING_MS - elapsed) / timeScale}
      lastTick={lastTick}
      result={judgeRing(hit.at, hit.at + RAID_CRIT_GUARD_MS, taps)}
    />
  )
}

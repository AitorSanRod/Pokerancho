import type { BattleRecord } from '../../game/battle/battle'
import { CRIT_RING_MS } from '../../game/battle/critTiming'
import { battleDuration } from '../../game/run/battleTimeline'
import { ringAt, ringResult, type RouteBattleSetup } from '../../game/run/tapCrit'
import { RING_LOOKAHEAD_MS, TapRing } from '../shared/TapRing'

interface Props {
  record: BattleRecord
  setup: RouteBattleSetup
  msLeft: number
  /** Hora real del último tick (el combate va por `msLeft` desde entonces) */
  lastTick: number
}

/** Anillo del toque crítico sobre el rival de ruta, si el ataque que llega lo lleva */
export function CritRing({ record, setup, msLeft, lastTick }: Props) {
  const elapsed = battleDuration(record) - msLeft
  // Se busca un poco por delante: el anillo puede empezar entre este tick y el siguiente
  const ring = ringAt(record, setup.seed, elapsed) ?? ringAt(record, setup.seed, elapsed + RING_LOOKAHEAD_MS)
  if (!ring) return null
  return (
    <TapRing
      key={ring.ordinal}
      durationMs={CRIT_RING_MS}
      startsInMs={ring.at - CRIT_RING_MS - elapsed}
      lastTick={lastTick}
      result={ringResult(ring, setup.taps)}
    />
  )
}

import { useRef, useState } from 'react'
import { CRIT_RING_MS, judgeRing } from '../../game/battle/critTiming'
import { FIGHT_CRIT_GUARD_MS, type FightRing } from '../../game/raid/raidCrit'
import { TapRing } from '../shared/TapRing'

interface Props {
  ring: FightRing
  /** Hora real (del móvil) en que empezó la pelea: los toques se cuentan desde ahí */
  legStart: number
  /** Milisegundos de pelea a la hora del último tick */
  legMs: number
  lastTick: number
  /** Al acertarlo (una vez por anillo) */
  onCrit: () => void
}

/**
 * Anillo del golpe crítico sobre el jefe: mientras se ve, toda la escena es el botón. Un solo toque a tiempo lo
 * acierta (y el primer golpe del turno siguiente es crítico); tocar de más lo hace fallar. Quien lo pinta le da una
 * `key` por anillo
 */
export function RaidCritPad({ ring, legStart, legMs, lastTick, onCrit }: Props) {
  const [taps, setTaps] = useState<number[]>([])
  const credited = useRef(false)
  const result = judgeRing(ring.at, ring.at + FIGHT_CRIT_GUARD_MS, taps)

  const tap = () => {
    const next = [...taps, Date.now() - legStart]
    setTaps(next)
    if (credited.current || judgeRing(ring.at, ring.at + FIGHT_CRIT_GUARD_MS, next) !== 'crit') return
    credited.current = true
    onCrit()
  }

  return (
    <button className="raid-crit-pad" onPointerDown={tap} aria-label="Toca cuando se cierre el anillo">
      <span className="raid-crit-spot">
        <TapRing durationMs={CRIT_RING_MS} startsInMs={ring.at - CRIT_RING_MS - legMs} lastTick={lastTick} result={result} />
      </span>
    </button>
  )
}

import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react'
import type { TapChallenge, TapKind } from '../../data/incursionMoves'
import { CRIT_RING_MS } from '../../game/battle/critTiming'
import { partialGain, ringScore } from '../../game/incursion/tapChallenge'
import { judgeRings, ringHits, ringLayout, ringsDone, ringShowsAt, type RingMark, type RingSpot, type RingTap } from '../../game/incursion/tapRings'
import { TAP_WINDOW_MS } from '../../game/incursion/tapWindow'
import { RING_LOOKAHEAD_MS, TapRing } from '../shared/TapRing'
import type { TapPadProps } from './TapPad'
import { gainText, perfectText } from './tapText'

interface Props extends TapPadProps {
  challenge: Extract<TapChallenge, { kind: typeof TapKind.Rings }>
}

/** Píxeles desde el centro de un anillo en los que un toque cae encima (algo más que su radio, para el dedo) */
const RING_HIT_PX = 52

const RESULT = { hit: 'crit', miss: 'fail' } as const
const resultOf = (m: RingMark) => (m ? RESULT[m] : null)

/** El anillo sobre el que cae el toque, si cae sobre alguno de los que se ven */
function ringUnder(e: PointerEvent<HTMLElement>, spots: RingSpot[], shown: (s: RingSpot) => boolean): number | null {
  const box = e.currentTarget.getBoundingClientRect()
  const near = spots.findIndex((s) => shown(s) && Math.hypot(box.left + s.x * box.width - e.clientX, box.top + s.y * box.height - e.clientY) <= RING_HIT_PX)
  return near < 0 ? null : near
}

function summary(props: Props, marks: RingMark[]): string {
  const score = ringScore(ringHits(marks), marks.length)
  if (!ringsDone(marks)) return `Tócalos en orden cuando se cierren: ${ringHits(marks)}/${marks.length}`
  if (score >= 1) return perfectText(props.move)
  return score > 0 ? `${gainText(props.move, partialGain(props.challenge, score))} este turno` : 'Sin mejora este turno'
}

/**
 * Anillos: salen uno tras otro en sitios distintos y cada uno se toca una vez, encima y cuando se cierra. La parte
 * acertada mejora el ataque; todos, crítico (o cura crítica, o más mejora al grupo)
 */
export function RingsPad(props: Props) {
  const { challenge, seed, msLeft, lastTick, onScore } = props
  const spots = useMemo(() => ringLayout(challenge, seed), [challenge, seed])
  const [openedAt] = useState(() => lastTick - (TAP_WINDOW_MS - msLeft))
  const [taps, setTaps] = useState<RingTap[]>([])
  const reported = useRef({ hits: 0, done: false })
  const elapsed = lastTick - openedAt
  const marks = judgeRings(spots, taps, elapsed)
  const shown = (s: RingSpot) => elapsed >= ringShowsAt(s) - RING_LOOKAHEAD_MS

  const report = (now: RingMark[]) => {
    const hits = ringHits(now)
    const done = ringsDone(now)
    if (hits === reported.current.hits && done === reported.current.done) return
    reported.current = { hits, done }
    onScore(ringScore(hits, now.length), done)
  }

  useEffect(() => report(marks))

  const tap = (e: PointerEvent<HTMLButtonElement>) => {
    const next = [...taps, { t: Date.now() - openedAt, ring: ringUnder(e, spots, shown) }]
    setTaps(next)
    report(judgeRings(spots, next, elapsed))
  }

  return (
    <button className={`incursion-tap-pad rings ${ringsDone(marks) ? 'done' : ''}`} onPointerDown={tap} aria-label="Toca cada anillo cuando se cierre">
      <span className="incursion-tap-head">
        <span className="incursion-tap-title">{spots.length > 1 ? '¡Toca los anillos!' : '¡Toca el anillo!'}</span>
        <span className="tiny">{summary(props, marks)}</span>
      </span>
      {spots.map(
        (s, i) =>
          shown(s) && (
            <span key={i} className="tap-rings-spot" style={{ left: `${s.x * 100}%`, top: `${s.y * 100}%` }}>
              <TapRing durationMs={CRIT_RING_MS} startsInMs={ringShowsAt(s) - elapsed} lastTick={lastTick} result={resultOf(marks[i])} hitText="¡Bien!" label={spots.length > 1 ? String(i + 1) : undefined} />
            </span>
          ),
      )}
      <span className="incursion-tap-time" style={{ width: `${Math.max(0, (msLeft / TAP_WINDOW_MS) * 100)}%` }} />
    </button>
  )
}

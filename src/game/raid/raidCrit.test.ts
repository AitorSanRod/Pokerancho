import { describe, expect, it } from 'vitest'
import { CRIT_RING_MS, ringKey, ringShown } from '../battle/critTiming'
import { EventKind, type IncursionEvent } from '../incursion/events'
import type { LegResult } from '../incursion/incursionLeg'
import { eventStartMs } from '../incursion/incursionTimeline'
import { FIGHT_CRIT_GUARD_MS, fightRingAt } from './raidCrit'
import { RAID_BOSS_ID } from './raidFight'

const UID = 'yo'
const hit = (actor: string): IncursionEvent => ({ kind: EventKind.Hit, actor, target: RAID_BOSS_ID, text: '' })
const move = (actor: string): IncursionEvent => ({ kind: EventKind.Move, actor, text: '' })

/** Un tramo con golpes de `UID` al jefe hasta que alguno lleva anillo en la sala `roomId` */
function legWithRing(roomId: string): { leg: LegResult; seq: number } {
  const events: IncursionEvent[] = []
  for (;;) {
    events.push(move(UID), hit(UID), move('otro'), hit('otro'))
    const seq = events.length - 3
    if (ringShown(ringKey(roomId, seq))) return { leg: { events } as LegResult, seq }
  }
}

describe('anillo crítico en la pelea del jefe', () => {
  it('sale antes del golpe del jugador que lo lleva y se vigila un poco después', () => {
    const { leg, seq } = legWithRing('sala')
    const at = eventStartMs(leg, seq)
    expect(fightRingAt(leg, UID, 'sala', at - CRIT_RING_MS)).toEqual({ seq, at })
    expect(fightRingAt(leg, UID, 'sala', at + FIGHT_CRIT_GUARD_MS)).toEqual({ seq, at })
    expect(fightRingAt(leg, UID, 'sala', at + FIGHT_CRIT_GUARD_MS + 1)?.seq).not.toBe(seq)
  })

  it('no sale con los golpes de los demás', () => {
    const { leg } = legWithRing('sala')
    expect(fightRingAt(leg, 'nadie', 'sala', 0)).toBeNull()
  })
})

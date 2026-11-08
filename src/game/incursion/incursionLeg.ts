import { RoomKind, type Incursion } from '../../data/incursions'
import { seededRng, type Rng } from '../core/random'
import type { Battlefield } from './battlefield'
import { EventKind, view, type IncursionEvent } from './events'
import { foeFighter, memberState, partyFighter, type MemberState } from './fighter'
import { fightRoom, refreshPassives } from './groupBattle'
import { addEarnings, noEarnings, rollPrizes, type Earned } from './incursionRewards'
import { foeLevel, incursionLevel, syncedLevel } from './levelSync'
import { leaveRoom, restRoom } from './restRooms'

// Un tramo de incursión: las salas desde `start.room` hasta la siguiente de reorganizar o el final. Nadie decide nada
// dentro de un tramo, así que con la misma entrada y la misma semilla sale siempre lo mismo en todos los móviles.

export interface LegStart {
  /** Primera sala del tramo */
  room: number
  members: MemberState[]
  revives: number
}

export const LegOutcome = { Regroup: 'regroup', Win: 'win', Lose: 'lose' } as const
export type LegOutcome = (typeof LegOutcome)[keyof typeof LegOutcome]

export interface LegResult {
  events: IncursionEvent[]
  outcome: LegOutcome
  /** Cómo empieza el tramo siguiente (tras reorganizar) */
  next: LegStart
  /** Lo ganado en las salas superadas del tramo */
  earned: Earned
  /** Premio final: solo con `Win` */
  prize: Earned | null
}

function battlefield(inc: Incursion, start: LegStart, events: IncursionEvent[]): { bf: Battlefield; level: number } {
  const level = incursionLevel(inc, start.members.map((m) => m.level))
  const party = start.members.map((m) => partyFighter(m, syncedLevel(m.level, level)))
  const bf: Battlefield = { party, foes: [], revives: start.revives, turn: 0, falls: 0, passives: [], log: (e) => events.push(e) }
  refreshPassives(bf)
  return { bf, level }
}

export function simulateLeg(inc: Incursion, start: LegStart, seed: number): LegResult {
  const rng: Rng = seededRng(seed)
  const events: IncursionEvent[] = []
  const { bf, level } = battlefield(inc, start, events)
  let earned = noEarnings()
  const result = (outcome: LegOutcome, room: number, prize: Earned | null = null): LegResult => ({
    events,
    outcome,
    earned,
    prize,
    next: { room, revives: bf.revives, members: start.members.map((m, i) => memberState(bf.party[i], m)) },
  })

  for (let r = start.room; r < inc.rooms.length; r++) {
    const room = inc.rooms[r]
    if (room.kind === RoomKind.Regroup) {
      events.push({ kind: EventKind.Room, room: r, text: room.name })
      return result(LegOutcome.Regroup, r + 1)
    }
    if (room.kind !== RoomKind.Battle) {
      events.push({ kind: EventKind.Room, room: r, text: room.name })
      restRoom(bf, room)
      continue
    }
    bf.foes = room.foes.map((f, i) => foeFighter(f, `foe-${r}-${i}`, foeLevel(f, level)))
    events.push({ kind: EventKind.Room, room: r, text: room.name, fighters: [...bf.party, ...bf.foes].map(view) })
    if (fightRoom(bf, rng) === 'lose') return result(LegOutcome.Lose, r)
    events.push({ kind: EventKind.Cleared, room: r, reward: room.reward, text: `¡${room.name} superada!` })
    earned = addEarnings(earned, room.reward)
    leaveRoom(bf)
  }
  return result(LegOutcome.Win, inc.rooms.length, rollPrizes(inc.prizes, rng))
}

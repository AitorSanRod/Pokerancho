import { RoomKind, type Incursion } from '../../data/incursions'
import { seededRng, type Rng } from '../core/random'
import type { Battlefield } from './battlefield'
import { EventKind, view, type IncursionEvent } from './events'
import { pickFoe } from './foePool'
import { foeFighter, memberState, partyFighter, type MemberState } from './fighter'
import { fightRoom, refreshPassives } from './groupBattle'
import { addEarnings, noEarnings, rollPrizes, type Earned } from './incursionRewards'
import { eventMs } from './incursionTimeline'
import { leaveRoom, restRoom } from './restRooms'
import { TAP_WINDOW_MS, type TurnOrders } from './tapWindow'

// Un tramo de incursión: las salas desde `start.room` hasta la siguiente de reorganizar o el final. Lo único que se
// decide dentro son los toques de antes de cada turno: la simulación se para en la primera ventana de la que aún no se
// sabe quién ha potenciado su ataque. Con la misma entrada, semilla y toques sale siempre lo mismo en todos los móviles.

export interface LegStart {
  /** Primera sala del tramo */
  room: number
  members: MemberState[]
  revives: number
}

/** `Waiting`: parado en una ventana de toques de la que aún no se sabe el resultado */
export const LegOutcome = { Regroup: 'regroup', Win: 'win', Lose: 'lose', Waiting: 'waiting' } as const
export type LegOutcome = (typeof LegOutcome)[keyof typeof LegOutcome]

/** Las órdenes de la ventana `turn` del tramo, que acaba a los `windowEndMs`; undefined: aún no se saben */
export type LegTaps = (turn: number, windowEndMs: number) => TurnOrders | undefined

export interface LegResult {
  events: IncursionEvent[]
  outcome: LegOutcome
  /** Cómo empieza el tramo siguiente (tras reorganizar) */
  next: LegStart
  /** Lo ganado en las salas superadas del tramo */
  earned: Earned
  /** Premio final: solo con `Win` */
  prize: Earned | null
  /** Las órdenes de cada ventana jugada del tramo, en orden */
  turns: TurnOrders[]
}

function battlefield(start: LegStart, log: (e: IncursionEvent) => void): Battlefield {
  const party = start.members.map(partyFighter)
  const bf: Battlefield = { party, foes: [], revives: start.revives, turn: 0, falls: 0, passives: [], boosted: [], log }
  refreshPassives(bf)
  return bf
}

export function simulateLeg(inc: Incursion, start: LegStart, seed: number, resolveTaps: LegTaps): LegResult {
  const rng: Rng = seededRng(seed)
  const events: IncursionEvent[] = []
  const turns: TurnOrders[] = []
  let elapsedMs = 0
  const log = (e: IncursionEvent) => {
    events.push(e)
    elapsedMs += eventMs(e)
  }
  const bf = battlefield(start, log)
  /** Abre la ventana de toques del turno y da sus órdenes (undefined: aún no se saben) */
  const tapWindow = () => {
    const turn = turns.length
    const orders = resolveTaps(turn, elapsedMs + TAP_WINDOW_MS)
    log({ kind: EventKind.TapWindow, turn, text: '¡Toca para potenciar tu ataque!' })
    if (orders) turns.push(orders)
    return orders
  }
  let earned = noEarnings()
  const result = (outcome: LegOutcome, room: number, prize: Earned | null = null): LegResult => ({
    events,
    outcome,
    earned,
    prize,
    turns,
    next: { room, revives: bf.revives, members: start.members.map((m, i) => memberState(bf.party[i], m)) },
  })

  for (let r = start.room; r < inc.rooms.length; r++) {
    const room = inc.rooms[r]
    if (room.kind === RoomKind.Regroup) {
      log({ kind: EventKind.Room, room: r, text: room.name })
      return result(LegOutcome.Regroup, r + 1)
    }
    if (room.kind !== RoomKind.Battle) {
      log({ kind: EventKind.Room, room: r, text: room.name })
      restRoom(bf, room)
      continue
    }
    bf.foes = room.foes.map((slot, i) => foeFighter(pickFoe(slot, rng), `foe-${r}-${i}`))
    log({ kind: EventKind.Room, room: r, text: room.name, fighters: [...bf.party, ...bf.foes].map(view) })
    const outcome = fightRoom(bf, rng, tapWindow)
    if (outcome === 'waiting') return result(LegOutcome.Waiting, r)
    if (outcome === 'lose') return result(LegOutcome.Lose, r)
    log({ kind: EventKind.Cleared, room: r, reward: room.reward, text: `¡${room.name} superada!` })
    earned = addEarnings(earned, room.reward)
    leaveRoom(bf)
  }
  return result(LegOutcome.Win, inc.rooms.length, rollPrizes(inc.prizes, rng))
}

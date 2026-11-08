import { incursion, type IncursionId } from '../../data/incursions'
import type { MemberState } from './fighter'
import { IncursionOutcome, simulateIncursion, type IncursionRecord, type LegOrders, type Retreat } from './incursionRun'
import { eventsStarted, legDuration } from './incursionTimeline'

// Una incursión tal y como se guarda (en la partida y en el servidor): quién entró, las órdenes de cada tramo y cuándo
// empezó cada uno. Lo demás (combates, PS, premios) se recalcula siempre igual a partir de esto y de la hora.

/** Milisegundos reales que dura una sala de reorganizar: lo que hay para cambiar de movimiento */
export const REGROUP_MS = 90_000

/** Lo que decide cómo va una incursión: lo comparten la partida y el servidor */
export interface IncursionPlan {
  incursionId: IncursionId
  /** Cómo entró cada uno (jugadores y bots); el de un jugador lleva el uid de su Pokémon */
  members: MemberState[]
  orders: LegOrders[]
  /** Hora real (ms) en que empezó cada tramo */
  legStarts: number[]
  retreat: Retreat | null
}

/** Lo del grupo con otros jugadores que sabe el móvil (ver online/protocol.ts › GroupView) */
export interface OnlineIncursion {
  groupId: string
  /** Apodo de cada jugador por el id de su Pokémon en `members` */
  nicknames: Record<string, string>
  /** Pokémon de los jugadores que han votado retirarse */
  votes: string[]
  /** Pokémon de los jugadores que ya han dado a seguir en la sala de reorganizar */
  ready: string[]
  /** Movimiento elegido por cada uno en la sala de reorganizar en curso */
  nextMoves: Record<string, string>
}

/** La incursión en la que está el jugador */
export interface ActiveIncursion extends IncursionPlan {
  /** El Pokémon del jugador; en `members` va con este mismo id */
  uid: string
  /** Movimiento elegido en la sala de reorganizar en curso, para el tramo siguiente; null si no lo ha cambiado */
  nextMove: string | null
  /** Con otros jugadores, lo que dice el servidor (él decide cuándo empieza cada tramo); null: en local, con bots */
  online: OnlineIncursion | null
}

export const IncursionPhase = { Playing: 'playing', Regroup: 'regroup', Finished: 'finished' } as const
export type IncursionPhase = (typeof IncursionPhase)[keyof typeof IncursionPhase]

export interface IncursionProgress {
  phase: IncursionPhase
  record: IncursionRecord
  /** Tramo que se está viendo */
  leg: number
  /** Milisegundos jugados de ese tramo (sin pasar de su duración) */
  legMs: number
  /** Sala de reorganizar: milisegundos que quedan para cambiar de movimiento */
  regroupMsLeft: number
}

let cache: { key: string; record: IncursionRecord } | null = null

/** La incursión simulada; se guarda la última, porque la pantalla la pide muchas veces seguidas */
export function recordOf(a: IncursionPlan): IncursionRecord {
  const key = JSON.stringify([a.incursionId, a.members, a.orders, a.retreat])
  if (cache?.key !== key) cache = { key, record: simulateIncursion(incursion(a.incursionId), a.members, a.orders, a.retreat) }
  return cache.record
}

export function incursionProgress(a: IncursionPlan, now: number): IncursionProgress {
  const record = recordOf(a)
  const leg = record.legs.length - 1
  const duration = legDuration(record.legs[leg])
  const elapsed = Math.max(0, now - a.legStarts[leg])
  const legMs = Math.min(elapsed, duration)
  if (a.retreat) return { phase: IncursionPhase.Finished, record, leg, legMs: a.retreat.atMs, regroupMsLeft: 0 }
  if (elapsed < duration) return { phase: IncursionPhase.Playing, record, leg, legMs, regroupMsLeft: 0 }
  if (record.outcome === IncursionOutcome.Pending) {
    return { phase: IncursionPhase.Regroup, record, leg, legMs, regroupMsLeft: Math.max(0, duration + REGROUP_MS - elapsed) }
  }
  return { phase: IncursionPhase.Finished, record, leg, legMs, regroupMsLeft: 0 }
}

/** Fracción de PS con la que acaba un Pokémon: la del último evento que le tocó antes del final (o de la retirada) */
export function finalHpFraction(a: IncursionPlan, p: IncursionProgress, id: string): number {
  for (let l = p.leg; l >= 0; l--) {
    const leg = p.record.legs[l]
    const seen = l === p.leg ? eventsStarted(leg, p.legMs) : leg.events.length
    const last = leg.events.slice(0, seen).findLast((e) => e.target === id && !!e.maxHp)
    if (last) return last.hp! / last.maxHp!
  }
  return a.members.find((m) => m.id === id)?.hpFraction ?? 1
}

/**
 * Empieza el tramo siguiente a la hora `at` con los movimientos cambiados al reorganizar. Su semilla sale de la primera,
 * así el móvil y el servidor llegan a la misma
 */
export function startNextLeg(a: IncursionPlan, at: number, moves: Record<string, string>) {
  const seed = (a.orders[0].seed + a.orders.length * 7919) % 2 ** 31
  a.orders.push({ seed, moves })
  a.legStarts.push(at)
}

/** Hora a la que acaba el plazo de la sala de reorganizar en curso */
export function regroupEnd(a: IncursionPlan, p: IncursionProgress): number {
  return a.legStarts[p.leg] + legDuration(p.record.legs[p.leg]) + REGROUP_MS
}

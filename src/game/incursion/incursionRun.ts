import type { Incursion } from '../../data/incursions'
import type { MemberState } from './fighter'
import { LegOutcome, simulateLeg, type LegResult, type LegStart } from './incursionLeg'
import { addEarnings, noEarnings, type Earned } from './incursionRewards'
import { earnedBefore } from './incursionTimeline'
import { INCURSION_REVIVES } from './revives'
import type { TapResolver } from './tapWindow'

// Una incursión entera: los tramos uno tras otro, cada uno con su semilla, los movimientos que se eligieron al
// reorganizar y quién potenció su ataque en cada ventana de toques. Es lo que guardan el servidor y la partida; los
// eventos se recalculan siempre igual a partir de esto.

/**
 * Lo que decide cada tramo: su semilla, los movimientos que cambiaron al reorganizar (id → movimiento) y, por cada
 * ventana de toques ya cerrada, quiénes potenciaron su ataque
 */
export interface LegOrders {
  seed: number
  moves: Record<string, string>
  taps: string[][]
}

/** Retirada votada: en qué tramo y a cuántos ms de empezarlo se alcanzaron los votos */
export interface Retreat {
  leg: number
  atMs: number
}

export const IncursionOutcome = { ...LegOutcome, Retreat: 'retreat', Pending: 'pending' } as const
export type IncursionOutcome = (typeof IncursionOutcome)[keyof typeof IncursionOutcome]

export interface IncursionRecord {
  legs: LegResult[]
  /**
   * `Pending`: el último tramo acabó en una sala de reorganizar y faltan las órdenes del siguiente. `Waiting`: parado en una
   * ventana de toques de la que aún no se sabe el resultado
   */
  outcome: IncursionOutcome
  /** Lo que se lleva cada jugador (con la retirada, lo ganado hasta ese momento) */
  earned: Earned
}

const withMoves = (start: LegStart, moves: Record<string, string>): LegStart => ({
  ...start,
  members: start.members.map((m) => ({ ...m, moveId: moves[m.id] ?? m.moveId })),
})

/** Lo que dicen las órdenes: los toques de las ventanas ya cerradas */
export const tapsFromOrders = (orders: LegOrders[]): TapResolver => (leg, turn) => orders[leg]?.taps?.[turn]

export function simulateIncursion(
  inc: Incursion,
  members: MemberState[],
  orders: LegOrders[],
  retreat: Retreat | null = null,
  resolveTaps: TapResolver = tapsFromOrders(orders),
): IncursionRecord {
  const legs: LegResult[] = []
  let start: LegStart = { room: 0, members, revives: INCURSION_REVIVES }
  let earned = noEarnings()
  for (const [i, order] of orders.entries()) {
    const leg = simulateLeg(inc, withMoves(start, order.moves), order.seed, (turn, endMs) => resolveTaps(i, turn, endMs))
    legs.push(leg)
    if (retreat?.leg === i) return { legs, outcome: IncursionOutcome.Retreat, earned: addEarnings(earned, earnedBefore(leg, retreat.atMs)) }
    earned = addEarnings(earned, leg.earned)
    if (leg.outcome !== LegOutcome.Regroup) return { legs, outcome: leg.outcome, earned: addEarnings(earned, leg.prize ?? {}) }
    start = leg.next
  }
  return { legs, outcome: IncursionOutcome.Pending, earned }
}

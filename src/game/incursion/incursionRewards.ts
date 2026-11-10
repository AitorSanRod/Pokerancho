import { IncursionPrizeKind, type IncursionPrize } from '../../data/incursions'
import type { StarItem } from '../../data/starItems'
import type { Tm } from '../../data/tms'
import type { Rng } from '../core/random'

// Lo que gana cada jugador en una incursión: lo de cada sala superada por el camino (se lo queda aunque luego pierda o
// se retire) y, si la termina, el premio final, cuyas líneas se tiran por separado (₽, EXP, tickets, tickets de especie,
// objetos estelares y MTs).

export interface Earned {
  money: number
  exp: number
  tickets: number
  /** Tickets de especie: speciesId → cantidad */
  pieces: Record<number, number>
  /** Objetos estelares: objeto → cantidad */
  starItems: Partial<Record<StarItem, number>>
  /** MTs: MT → cantidad */
  tms: Partial<Record<Tm, number>>
}

export const noEarnings = (): Earned => ({ money: 0, exp: 0, tickets: 0, pieces: {}, starItems: {}, tms: {} })

/** Suma dos tablas de cantidades */
function addCounts<K extends string | number>(a: Partial<Record<K, number>>, b: Partial<Record<K, number>> = {}): Partial<Record<K, number>> {
  const sum = { ...a }
  for (const [k, n] of Object.entries(b) as [K, number][]) sum[k] = (sum[k] ?? 0) + n
  return sum
}

export function addEarnings(total: Earned, more: Partial<Earned>): Earned {
  return {
    money: total.money + (more.money ?? 0),
    exp: total.exp + (more.exp ?? 0),
    tickets: total.tickets + (more.tickets ?? 0),
    pieces: addCounts(total.pieces, more.pieces) as Record<number, number>,
    starItems: addCounts(total.starItems, more.starItems),
    tms: addCounts(total.tms, more.tms),
  }
}

function prizeEarnings(p: IncursionPrize): Partial<Earned> {
  if (p.kind === IncursionPrizeKind.Pieces) return { pieces: { [p.speciesId]: p.amount } }
  if (p.kind === IncursionPrizeKind.StarItem) return { starItems: { [p.item]: p.amount } }
  if (p.kind === IncursionPrizeKind.Tm) return { tms: { [p.tm]: p.amount } }
  return { [p.kind]: p.amount }
}

export function rollPrizes(prizes: IncursionPrize[], rng: Rng): Earned {
  let won = noEarnings()
  for (const p of prizes) {
    if (rng() >= p.chance) continue
    won = addEarnings(won, prizeEarnings(p))
  }
  return won
}

import { IncursionPrizeKind, type IncursionPrize } from '../../data/incursions'
import type { StarItem } from '../../data/starItems'
import type { Rng } from '../core/random'

// Lo que gana cada jugador en una incursión: lo de cada sala superada por el camino (se lo queda aunque luego pierda o
// se retire) y, si la termina, el premio final, cuyas líneas se tiran por separado (₽, EXP, tickets, tickets de especie
// y objetos estelares).

export interface Earned {
  money: number
  exp: number
  tickets: number
  /** Tickets de especie: speciesId → cantidad */
  pieces: Record<number, number>
  /** Objetos estelares: objeto → cantidad */
  starItems: Partial<Record<StarItem, number>>
}

export const noEarnings = (): Earned => ({ money: 0, exp: 0, tickets: 0, pieces: {}, starItems: {} })

export function addEarnings(total: Earned, more: Partial<Earned>): Earned {
  const pieces = { ...total.pieces }
  for (const [id, n] of Object.entries(more.pieces ?? {})) pieces[Number(id)] = (pieces[Number(id)] ?? 0) + n
  const starItems = { ...total.starItems }
  for (const [item, n] of Object.entries(more.starItems ?? {}) as [StarItem, number][]) starItems[item] = (starItems[item] ?? 0) + n
  return {
    money: total.money + (more.money ?? 0),
    exp: total.exp + (more.exp ?? 0),
    tickets: total.tickets + (more.tickets ?? 0),
    pieces,
    starItems,
  }
}

function prizeEarnings(p: IncursionPrize): Partial<Earned> {
  if (p.kind === IncursionPrizeKind.Pieces) return { pieces: { [p.speciesId]: p.amount } }
  if (p.kind === IncursionPrizeKind.StarItem) return { starItems: { [p.item]: p.amount } }
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

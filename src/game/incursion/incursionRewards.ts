import { IncursionPrizeKind, type IncursionPrize } from '../../data/incursions'
import type { Rng } from '../core/random'

// Lo que gana cada jugador en una incursión: lo de cada sala superada por el camino (se lo queda aunque luego pierda o
// se retire) y, si la termina, el premio final, cuyas líneas se tiran por separado.

export interface Earned {
  money: number
  exp: number
  tickets: number
  /** Tickets de especie: speciesId → cantidad */
  pieces: Record<number, number>
}

export const noEarnings = (): Earned => ({ money: 0, exp: 0, tickets: 0, pieces: {} })

export function addEarnings(total: Earned, more: Partial<Earned>): Earned {
  const pieces = { ...total.pieces }
  for (const [id, n] of Object.entries(more.pieces ?? {})) pieces[Number(id)] = (pieces[Number(id)] ?? 0) + n
  return {
    money: total.money + (more.money ?? 0),
    exp: total.exp + (more.exp ?? 0),
    tickets: total.tickets + (more.tickets ?? 0),
    pieces,
  }
}

export function rollPrizes(prizes: IncursionPrize[], rng: Rng): Earned {
  let won = noEarnings()
  for (const p of prizes) {
    if (rng() >= p.chance) continue
    won = addEarnings(won, p.kind === IncursionPrizeKind.Pieces ? { pieces: { [p.speciesId]: p.amount } } : { [p.kind]: p.amount })
  }
  return won
}

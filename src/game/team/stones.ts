import { STONES, type Stone } from '../../data/stones'
import type { GameState } from '../core/state'

/** ₽ que cuesta el objeto evolutivo en la tienda (sin límite de compra) */
export const stonePrice = (stone: Stone): number => STONES[stone].price

export const stonesOf = (s: GameState, stone: Stone): number => s.stones[stone] ?? 0

/** Compra una piedra; false si no hay ₽ */
export function buyStone(s: GameState, stone: Stone): boolean {
  const price = stonePrice(stone)
  if (s.money < price) return false
  s.money -= price
  s.stones[stone] = stonesOf(s, stone) + 1
  return true
}

/** Gasta una piedra al evolucionar; false si no queda ninguna */
export function spendStone(s: GameState, stone: Stone): boolean {
  if (stonesOf(s, stone) < 1) return false
  s.stones[stone] = stonesOf(s, stone) - 1
  return true
}

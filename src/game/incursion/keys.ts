import { incursion, KEY_PRICE, MAX_KEYS, type IncursionId } from '../../data/incursions'
import type { GameState } from '../core/state'

// Llaves de incursión: se compran en la Tienda (el precio depende de la dificultad) y se gasta una al entrar.

export const keysOf = (s: GameState, id: IncursionId): number => s.incursionKeys[id] ?? 0

export const keyPrice = (id: IncursionId): number => KEY_PRICE[incursion(id).tier]

/** Por qué no se puede comprar la llave (null si se puede) */
export function buyKeyBlocker(s: GameState, id: IncursionId): string | null {
  if (keysOf(s, id) >= MAX_KEYS) return `Ya tienes ${MAX_KEYS} llaves de esta incursión.`
  if (s.money < keyPrice(id)) return 'No tienes ₽ suficientes.'
  return null
}

export function buyKey(s: GameState, id: IncursionId): boolean {
  if (buyKeyBlocker(s, id)) return false
  s.money -= keyPrice(id)
  s.incursionKeys[id] = keysOf(s, id) + 1
  return true
}

/** Gasta una llave al entrar; false si no queda ninguna */
export function spendKey(s: GameState, id: IncursionId): boolean {
  if (keysOf(s, id) < 1) return false
  s.incursionKeys[id] = keysOf(s, id) - 1
  return true
}

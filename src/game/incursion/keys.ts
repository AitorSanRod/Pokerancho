import { incursion, KEY_PRICE, MAX_KEYS, type IncursionId } from '../../data/incursions'
import type { GameState } from '../core/state'

// Llaves de incursión: se compran en la Tienda (el precio depende de la dificultad) y se gasta una al entrar. Las
// gratuitas (`free`) no la piden ni la venden.

export const keysOf = (s: GameState, id: IncursionId): number => s.incursionKeys[id] ?? 0

/** false si es gratuita: se entra sin llave */
export const needsKey = (id: IncursionId): boolean => !incursion(id).free

/** true si puede pagar la entrada: es gratuita o le queda alguna llave */
export const canAffordEntry = (s: GameState, id: IncursionId): boolean => !needsKey(id) || keysOf(s, id) > 0

export const keyPrice = (id: IncursionId): number => KEY_PRICE[incursion(id).tier]

/** Por qué no se puede comprar la llave (null si se puede) */
export function buyKeyBlocker(s: GameState, id: IncursionId): string | null {
  if (!needsKey(id)) return 'Esta incursión no pide llave.'
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

/** Gasta una llave al entrar (en las gratuitas, ninguna); false si no queda ninguna */
export function spendKey(s: GameState, id: IncursionId): boolean {
  if (!needsKey(id)) return true
  if (keysOf(s, id) < 1) return false
  s.incursionKeys[id] = keysOf(s, id) - 1
  return true
}

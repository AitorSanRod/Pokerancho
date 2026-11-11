import type { FoeSlot, IncursionFoe } from '../../data/incursions'
import type { Rng } from '../core/random'

// Rivales al azar de una sala: se eligen al entrar con el rng del tramo, así que con la misma semilla sale el mismo
// rival en el servidor y en todos los móviles.

const isPool = (slot: FoeSlot): slot is Extract<FoeSlot, { pool: unknown }> => 'pool' in slot

/** El rival que ocupa una plaza: el fijo, o uno de su lista según el peso de cada opción */
export function pickFoe(slot: FoeSlot, rng: Rng): IncursionFoe {
  if (!isPool(slot)) return slot
  let roll = rng() * slot.pool.reduce((sum, o) => sum + o.weight, 0)
  for (const option of slot.pool) {
    roll -= option.weight
    if (roll < 0) return option.foe
  }
  return slot.pool[slot.pool.length - 1].foe
}

/** Todos los rivales que pueden salir en una plaza */
export const possibleFoes = (slot: FoeSlot): IncursionFoe[] => (isPool(slot) ? slot.pool.map((o) => o.foe) : [slot])

import { incursion } from '../../data/incursions'
import type { IncursionPlan } from './activeIncursion'
import { simulateIncursion } from './incursionRun'
import { noTurnOrders, type TapResolver, type TurnOrders } from './tapWindow'

// Cerrar las ventanas de toques: cuando pasa su hora (más `delayMs`), se apuntan sus órdenes. La primera que estaba
// abierta se cierra con `pending` (los toques y cambios de ataque que llegaron a tiempo); las demás que hayan pasado sin
// nadie mirando (app cerrada), sin nada. Todo en una sola simulación, para que el servidor no se pase de tiempo.

/** Cierra las ventanas ya pasadas; devuelve si ha cerrado alguna */
export function settleTaps(a: IncursionPlan, now: number, delayMs: number, pending: TurnOrders): boolean {
  let first = true
  const resolve: TapResolver = (leg, turn, windowEndMs) => {
    const known = a.orders[leg]?.turns?.[turn]
    if (known) return known
    if (a.legStarts[leg] + windowEndMs + delayMs > now) return undefined
    const orders = first ? pending : noTurnOrders()
    first = false
    return orders
  }
  const record = simulateIncursion(incursion(a.incursionId), a.members, a.orders, a.retreat, resolve)
  let settled = false
  record.legs.forEach((leg, i) => {
    if (leg.turns.length <= (a.orders[i].turns?.length ?? 0)) return
    a.orders[i].turns = leg.turns
    settled = true
  })
  return settled
}


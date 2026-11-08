import { incursion } from '../../data/incursions'
import type { IncursionPlan } from './activeIncursion'
import { simulateIncursion } from './incursionRun'
import type { TapResolver } from './tapWindow'

// Cerrar las ventanas de toques: cuando pasa su hora (más `delayMs`), se apunta en las órdenes quién potenció su
// ataque. La primera que estaba abierta se cierra con `pending` (los que llegaron a tiempo); las demás que hayan pasado
// sin nadie mirando (app cerrada), sin nadie. Todo en una sola simulación, para que el servidor no se pase de tiempo.

/** Cierra las ventanas ya pasadas; devuelve si ha cerrado alguna */
export function settleTaps(a: IncursionPlan, now: number, delayMs: number, pending: string[]): boolean {
  let first = true
  const resolve: TapResolver = (leg, turn, windowEndMs) => {
    const known = a.orders[leg]?.taps?.[turn]
    if (known) return known
    if (a.legStarts[leg] + windowEndMs + delayMs > now) return undefined
    const taps = first ? pending : []
    first = false
    return taps
  }
  const record = simulateIncursion(incursion(a.incursionId), a.members, a.orders, a.retreat, resolve)
  let settled = false
  record.legs.forEach((leg, i) => {
    if (leg.taps.length <= (a.orders[i].taps?.length ?? 0)) return
    a.orders[i].taps = leg.taps
    settled = true
  })
  return settled
}


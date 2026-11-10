import type { MonDamage } from '../../core/ranking'
import { incursionProgress, IncursionPhase, type IncursionProgress } from '../activeIncursion'
import { EventKind } from '../events'
import { eventsStarted } from '../incursionTimeline'
import type { Seat, SharedIncursion } from './sharedIncursion'

// El daño de un grupo de incursión para el ranking de daño (worker/db/damageRanking.ts): solo el que reciben los
// jefes, sumando todos los tramos hasta el final (o la retirada). Se apunta una sola vez, al terminar la incursión.

/** Daño de cada Pokémon de los jugadores a los jefes en lo jugado; sin los bots ni los que no les hicieron nada */
export function bossDamage(p: IncursionProgress, seats: Seat[]): Map<string, number> {
  const total = new Map(seats.map((s) => [s.memberId, 0]))
  for (const [l, leg] of p.record.legs.slice(0, p.leg + 1).entries()) {
    const seen = l === p.leg ? eventsStarted(leg, p.legMs) : leg.events.length
    let bosses = new Set<string>()
    for (const e of leg.events.slice(0, seen)) {
      if (e.kind === EventKind.Room) bosses = new Set(e.fighters?.filter((f) => f.boss).map((f) => f.id))
      if (e.kind === EventKind.Hit && e.actor && total.has(e.actor) && bosses.has(e.target ?? '')) {
        total.set(e.actor, total.get(e.actor)! + (e.amount ?? 0))
      }
    }
  }
  return total
}

/** Si la incursión ha terminado y su daño aún no está apuntado, lo devuelve y la marca como apuntada; si no, lista vacía */
export function takeBossDamage(g: SharedIncursion, now: number): MonDamage[] {
  if (!g.damagePending) return []
  const p = incursionProgress(g, now)
  if (p.phase !== IncursionPhase.Finished) return []
  g.damagePending = false
  const damage = bossDamage(p, g.seats)
  return g.seats.flatMap((seat) => {
    const dealt = Math.round(damage.get(seat.memberId) ?? 0)
    const speciesId = g.members.find((m) => m.id === seat.memberId)?.speciesId
    return speciesId !== undefined && dealt > 0 ? [{ playerId: seat.playerId, uid: seat.memberId, speciesId, damage: dealt }] : []
  })
}

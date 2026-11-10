import type { IncursionProgress } from './activeIncursion'
import { EventKind } from './events'
import { eventsStarted } from './incursionTimeline'

// Recuento del daño de la incursión: lo que ha quitado cada Pokémon del grupo sumando todos sus combates, hasta
// el momento que se ve. Sale de los golpes ya reproducidos; no cuenta el daño de los estados (no tiene autor).

export interface DamageLine {
  id: string
  damage: number
}

/** Daño hecho por cada miembro del grupo, de más a menos (los que no han golpeado, con 0) */
export function partyDamage(p: IncursionProgress): DamageLine[] {
  const total = new Map(p.record.legs[p.leg].next.members.map((m) => [m.id, 0]))
  for (const [l, leg] of p.record.legs.slice(0, p.leg + 1).entries()) {
    const seen = l === p.leg ? eventsStarted(leg, p.legMs) : leg.events.length
    for (const e of leg.events.slice(0, seen)) {
      if (e.kind === EventKind.Hit && e.actor && total.has(e.actor)) total.set(e.actor, total.get(e.actor)! + (e.amount ?? 0))
    }
  }
  return [...total].map(([id, damage]) => ({ id, damage })).sort((a, b) => b.damage - a.damage)
}

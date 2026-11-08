import { EventKind, type IncursionEvent } from './events'
import type { LegResult } from './incursionLeg'
import { noEarnings, addEarnings, type Earned } from './incursionRewards'

// Cuánto se ve cada evento de una incursión. Cada tramo se simula entero y se reproduce en tiempo real desde que
// empieza; con la hora se sabe por dónde va (y dónde corta una retirada) igual en todos los móviles.

/** Milisegundos reales que dura en pantalla cada tipo de evento */
export const INCURSION_EVENT_MS: Record<EventKind, number> = {
  [EventKind.Room]: 2500,
  [EventKind.Move]: 900,
  [EventKind.Hit]: 1100,
  [EventKind.Miss]: 1000,
  [EventKind.Faint]: 1300,
  [EventKind.Status]: 1100,
  [EventKind.Heal]: 900,
  [EventKind.Change]: 900,
  [EventKind.Taunt]: 1000,
  [EventKind.Revive]: 1200,
  [EventKind.Out]: 1200,
  [EventKind.Rage]: 1200,
  [EventKind.Passives]: 1000,
  [EventKind.Cleared]: 2000,
}

const eventMs = (e: IncursionEvent) => INCURSION_EVENT_MS[e.kind]

export const legDuration = (leg: LegResult): number => leg.events.reduce((sum, e) => sum + eventMs(e), 0)

/** Cuántos eventos del tramo han empezado ya a los `ms` de comenzar */
export function eventsStarted(leg: LegResult, ms: number): number {
  let elapsed = 0
  for (let i = 0; i < leg.events.length; i++) {
    if (elapsed > ms) return i
    elapsed += eventMs(leg.events[i])
  }
  return leg.events.length
}

/** Lo ganado en las salas superadas del tramo antes de los `ms` (al retirarse se cobra solo eso) */
export function earnedBefore(leg: LegResult, ms: number): Earned {
  return leg.events
    .slice(0, eventsStarted(leg, ms))
    .filter((e) => e.kind === EventKind.Cleared && e.reward)
    .reduce((total, e) => addEarnings(total, e.reward!), noEarnings())
}

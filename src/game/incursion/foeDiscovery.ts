import { isSeen, markSeen } from '../collection/dex'
import type { GameState } from '../core/state'
import type { IncursionProgress } from './activeIncursion'
import { EventKind } from './events'
import { Team } from './fighter'
import { eventsStarted } from './incursionTimeline'

// Los rivales de una incursión no se descubren al verlos, sino al derrotarlos: cuentan los que han caído hasta el
// momento que se ve (con la retirada, hasta ella).

/** Especies de los rivales derrotados en la incursión, sin repetir y en el orden en que cayeron */
export function defeatedFoes(p: IncursionProgress): number[] {
  const defeated = new Set<number>()
  for (const [l, leg] of p.record.legs.slice(0, p.leg + 1).entries()) {
    const played = l === p.leg ? eventsStarted(leg, p.legMs) : leg.events.length
    const foes = new Map<string, number>()
    for (const e of leg.events.slice(0, played)) {
      for (const f of e.fighters ?? []) if (f.team === Team.Foe) foes.set(f.id, f.speciesId)
      const speciesId = e.kind === EventKind.Faint ? foes.get(e.target ?? '') : undefined
      if (speciesId !== undefined) defeated.add(speciesId)
    }
  }
  return [...defeated]
}

/** Rivales derrotados que aún no estaban en la Pokédex: los que descubre la incursión al cobrarla */
export const newDiscoveries = (s: GameState, p: IncursionProgress): number[] => defeatedFoes(p).filter((id) => !isSeen(s, id))

/** Apunta en la Pokédex a los rivales derrotados */
export function discoverDefeatedFoes(s: GameState, p: IncursionProgress) {
  for (const id of defeatedFoes(p)) markSeen(s, id)
}

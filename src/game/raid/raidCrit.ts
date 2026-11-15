import { CRIT_RING_MS, ringKey, ringShown } from '../battle/critTiming'
import { EventKind } from '../incursion/events'
import type { LegResult } from '../incursion/incursionLeg'
import { eventMs } from '../incursion/incursionTimeline'
import { RAID_BOSS_ID } from './raidFight'

// El toque crítico en la pelea contra el jefe: antes de algunos golpes del jugador al jefe sale un anillo que se cierra
// justo cuando llega el golpe (las reglas, en battle/critTiming.ts). Ese golpe ya está jugado igual en todos los
// móviles, así que acertarlo hace crítico su primer golpe del turno siguiente (raidPlay.ts › markRaidCrit).

/** Milisegundos tras llegar el golpe en que se siguen vigilando los toques: uno de más ahí también hace fallar */
export const FIGHT_CRIT_GUARD_MS = 300

/** Un anillo: el evento del golpe en el tramo y a los cuántos ms del tramo llega */
export interface FightRing {
  seq: number
  at: number
}

/**
 * El anillo que se ve a los `ms` del tramo, si lo hay: el de un golpe del Pokémon `uid` al jefe que llega dentro de
 * CRIT_RING_MS (o que acaba de llegar). Si un golpe lleva anillo se decide con la sala y el número del evento
 */
export function fightRingAt(leg: LegResult, uid: string, roomId: string, ms: number): FightRing | null {
  let at = 0
  for (const [seq, e] of leg.events.entries()) {
    if (at - CRIT_RING_MS > ms) return null
    const mine = e.kind === EventKind.Hit && e.actor === uid && e.target === RAID_BOSS_ID
    if (mine && ms <= at + FIGHT_CRIT_GUARD_MS && ringShown(ringKey(roomId, seq))) return { seq, at }
    at += eventMs(e)
  }
  return null
}

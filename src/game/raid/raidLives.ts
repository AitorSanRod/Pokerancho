import type { Rng } from '../core/random'
import { findMon, type GameState } from '../core/state'
import { playerMembers, removePlayer } from './raidEngine'
import { presentEnough, rollPrize } from './raidPrizes'
import { outOfLives, RaidMemberKind, type Raid, type RaidMember } from './raidRoom'

// Las vidas contra los jefes de la pestaña Raids: cada Pokémon entra con TAB_RAID_LIVES y pierde una cada vez que cae.
// Al gastarlas sale de la sala, cobra en el acto (si estuvo dentro lo bastante) y ya no puede volver contra ese jefe;
// la pelea sigue sin él. Las paradas de ruta tienen sus propias vidas (routeRaid.ts › ROUTE_RAID_LIVES).

/** Veces que puede caer un Pokémon contra un jefe de la pestaña Raids antes de que lo saquen de la sala */
export const TAB_RAID_LIVES = 5

/** Ese Pokémon ya ha gastado sus vidas contra el jefe de `raid` */
export const spentLivesAgainst = (raid: Raid, uid: string): boolean =>
  raid.members.some((m) => m.id === uid && m.kind === RaidMemberKind.Player && outOfLives(m))

/** El Pokémon de esta partida que ha gastado sus vidas contra el jefe de `raid` y ha salido; undefined si no hay */
export const spentMember = (s: GameState, raid: Raid): RaidMember | undefined =>
  raid.members.find((m) => m.kind === RaidMemberKind.Player && m.left && outOfLives(m) && findMon(s, m.id))

/**
 * Saca de la sala al Pokémon `m`, que ha gastado sus vidas, y deja pendiente su premio si estuvo dentro al menos
 * RAID_MIN_PRESENCE de la pelea hasta ahora
 */
function sendOff(s: GameState, raid: Raid, m: RaidMember, rng: Rng) {
  removePlayer(s, m)
  if (presentEnough(m, raid.elapsedMs)) s.raidPrizes.push(rollPrize(raid.boss, m.id, rng))
}

/** Sala jugada en la partida: saca y paga a los Pokémon del jugador que acaban de gastar sus vidas */
export function sendOffSpent(s: GameState, raid: Raid, rng: Rng) {
  for (const m of playerMembers(raid).filter(outOfLives)) sendOff(s, raid, m, rng)
  // Si aún esperaba sitio en una sala del servidor, ya no hace falta
  if (raid.remote?.roomId === null) raid.remote = null
}

/**
 * Sala del servidor: `before` es la sala de la partida antes de aplicar la respuesta y `now`, la que manda el servidor.
 * Saca y paga a los que estaban dentro y el servidor dice que han gastado sus vidas
 */
export function sendOffSpentRemote(s: GameState, before: Raid, now: Raid, rng: Rng) {
  const inside = new Set(playerMembers(before).map((m) => m.id))
  for (const m of now.members) if (inside.has(m.id) && m.kind === RaidMemberKind.Player && outOfLives(m)) sendOff(s, now, m, rng)
}

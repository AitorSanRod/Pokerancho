import type { RaidBoss } from '../../data/raidBosses'
import type { GroupPlan } from '../incursion/activeIncursion'
import type { MemberState } from '../incursion/fighter'
import type { RaidRotation } from './online/protocol'
import { cycleBoss } from './rotationBosses'

// Una sala de jefe de la pestaña Raids, igual en la partida (sin servidor) y en el servidor: mientras está abierta se
// entra (cada jugador con un Pokémon y su ataque) y van llegando bots (raidBots.ts); al empezar la pelea se cierra con
// los que haya, los bots completan los huecos (raidLobby.ts) y se juega con el motor de incursiones (raidFight.ts).

/** Pokémon que caben en una sala, jugadores y bots */
export const RAID_ROOM_SIZE = 10

/** El Pokémon de un jugador en la sala (el id de `member` es el uid de su Pokémon) y el apodo de su entrenador */
export interface RaidEntrant {
  member: MemberState
  trainer: string
}

/** Premio de un jefe de la pestaña Raids, por la parte de su vida que le quitó la sala */
export interface RaidPrize {
  bossSpeciesId: number
  /** Pokémon del jugador que luchó y se lleva la EXP */
  uid: string
  money: number
  tickets: number
  /** Tickets (piezas) de la especie del jefe */
  pieces: number
  exp: number
}

export interface RaidRoom {
  id: string
  rotation: RaidRotation
  /** Ciclo del calendario (raidSchedule.ts): dice el jefe y cuándo empieza la pelea */
  cycle: number
  /** Semilla de los bots de la sala y de la pelea */
  seed: number
  /** Los Pokémon de los jugadores, por orden de llegada */
  entrants: RaidEntrant[]
  /** La pelea: quiénes luchan (jugadores y bots, en ese orden) y las órdenes de cada turno; null con la sala abierta */
  fight: GroupPlan | null
}

export const newRoom = (id: string, rotation: RaidRotation, cycle: number, seed: number): RaidRoom => ({ id, rotation, cycle, seed, entrants: [], fight: null })

export const roomBoss = (room: Pick<RaidRoom, 'rotation' | 'cycle'>): RaidBoss => cycleBoss(room.rotation, room.cycle)

/** Ya no cabe otro jugador: todos los sitios son de jugadores (los bots se echan para hacer sitio) */
export const roomFull = (room: RaidRoom): boolean => room.entrants.length >= RAID_ROOM_SIZE

/**
 * Sienta al Pokémon (si ya estaba, se cambia por el nuevo: otro ataque u otro Pokémon del mismo jugador); si la sala
 * se llena, el último bot en llegar se va. false si no cabe o la pelea ya ha empezado
 */
export function seatEntrant(room: RaidRoom, entrant: RaidEntrant, replaces: string | null = null): boolean {
  if (room.fight) return false
  const at = room.entrants.findIndex((e) => e.member.id === (replaces ?? entrant.member.id))
  if (at >= 0) room.entrants[at] = entrant
  else if (roomFull(room)) return false
  else room.entrants.push(entrant)
  return true
}

/** Saca de la sala abierta a ese Pokémon; false si la pelea ya ha empezado */
export function unseat(room: RaidRoom, memberId: string): boolean {
  if (room.fight) return false
  room.entrants = room.entrants.filter((e) => e.member.id !== memberId)
  return true
}


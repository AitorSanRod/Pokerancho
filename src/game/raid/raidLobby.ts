import type { MemberState } from '../incursion/fighter'
import { roomBots, shownBots } from './raidBots'
import { fightStart } from './raidSchedule'
import { RAID_ROOM_SIZE, roomBoss, type RaidRoom } from './raidRoom'

// El paso de la sala abierta a la pelea, igual en la partida y en el servidor.

/** Cierra la sala y empieza la pelea a su hora: los jugadores que haya y bots hasta llenarla */
export function startFight(room: RaidRoom) {
  if (room.fight) return
  const bots = roomBots(roomBoss(room), room.seed).slice(0, RAID_ROOM_SIZE - room.entrants.length)
  const members = [...room.entrants.map((e) => e.member), ...bots]
  room.fight = { members, orders: [{ seed: room.seed, moves: {}, turns: [] }], legStarts: [fightStart(room.cycle)], retreat: null }
}

/** Ya es la hora de la pelea y aún no ha empezado */
export const fightDue = (room: RaidRoom, now: number): boolean => !room.fight && now >= fightStart(room.cycle)

/** Los que se ven en la sala: en la pelea, los que luchan; con ella abierta, los jugadores y los bots que ya han llegado */
export const roomMembers = (room: RaidRoom, now: number): MemberState[] =>
  room.fight?.members ?? [...room.entrants.map((e) => e.member), ...shownBots(room, now)]

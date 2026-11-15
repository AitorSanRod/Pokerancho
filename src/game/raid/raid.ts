import { species } from '../../data/species'
import type { Rng } from '../core/random'
import { findMon, MonPlace, monPlace, type GameState } from '../core/state'
import type { MovePick } from '../incursion/tapWindow'
import { freshMember } from '../incursion/party'
import { monKnows } from '../incursion/repertoire'
import { monPerks } from '../team/perks'
import { maxHp } from '../team/stats'
import { RAID_ROTATIONS, RaidRotation } from './online/protocol'
import { cycleBoss } from './rotationBosses'
import { lateJoinBlocker, lateLocalRoom, seatLate } from './raidLateJoin'
import { raidMoveAllowed } from './raidMoves'
import { newRoom, seatEntrant, unseat, type RaidEntrant, type RaidRoom } from './raidRoom'
import { cycleAt, RaidStage, stageAt } from './raidSchedule'

// Los jefes de la pestaña Raids en la partida: uno por rotación (online/protocol.ts). Con la sala abierta se manda a un
// Pokémon del rancho con su ataque (se puede cambiar el ataque o el Pokémon, o salir); al empezar la pelea ya no se
// sale hasta que termina, pero aún se puede entrar en el sitio de un bot (raidLateJoin.ts). Con servidor la sala es suya (online/linkedRaid.ts); sin él, se juega aquí con bots
// (raidPlay.ts).

/** Cómo va la sala con el servidor: pidiendo entrar (o cambiar el ataque), ya suya, o en local con bots */
export const RaidLink = { Joining: 'joining', Online: 'online', Local: 'local' } as const
export type RaidLink = (typeof RaidLink)[keyof typeof RaidLink]

/** El jefe de una rotación en el que está el jugador */
export interface TabRaid {
  room: RaidRoom
  /** Su Pokémon (en la sala, el id de su miembro) */
  uid: string
  link: RaidLink
  /** Ataque y objetivo elegidos en plena pelea que aún no han llegado a una ventana de toques */
  pendingPick: MovePick | null
  /** Ha acertado el toque crítico: su primer golpe del turno siguiente será crítico */
  pendingCrit: boolean
  /** Ha pedido entrar en la pelea ya empezada y aún no ha llegado a una ventana de toques */
  pendingJoin: boolean
}

export type TabRaids = Record<RaidRotation, TabRaid | null>

/** Ninguna sala en la pestaña Raids */
export const noTabRaids = (): TabRaids => ({ [RaidRotation.Ordered]: null, [RaidRotation.Hard]: null })

/** Nombre con el que sale el jugador en su sala */
export const PLAYER_TRAINER = 'Tú'

/** Id de la sala local de una rotación en un ciclo */
const localRoomId = (rotation: RaidRotation, cycle: number) => `local/${rotation}/${cycle}`

/** La rotación en cuya sala está ese Pokémon; null si no está en ninguna */
export const raidRotationOf = (s: GameState, uid: string): RaidRotation | null => RAID_ROTATIONS.find((r) => s.raids[r]?.uid === uid) ?? null

/** Por qué no se puede entrar ahora en la sala de esa rotación (con cualquier Pokémon); null si se puede */
export function raidRoomBlocker(s: GameState, rotation: RaidRotation, now: number): string | null {
  const cycle = cycleAt(now)
  const own = s.raids[rotation]
  if (own && own.room.cycle !== cycle) return 'Antes recoge el premio del jefe anterior.'
  if (stageAt(cycle, now) === RaidStage.Lobby) return null
  if (own) return 'Tu Pokémon ya está en la pelea.'
  return lateJoinBlocker(lateLocalRoom(localRoomId(rotation, cycle), rotation, cycle, now), now)
}

/** Por qué no puede ir ese Pokémon con ese ataque contra el jefe de la rotación ahora; null si puede */
export function raidBlocker(s: GameState, rotation: RaidRotation, uid: string, moveId: string, now: number): string | null {
  const roomBlock = raidRoomBlocker(s, rotation, now)
  if (roomBlock) return roomBlock
  const mon = findMon(s, uid)
  if (!mon) return 'Ese Pokémon no existe.'
  const already = s.raids[rotation]?.uid === uid
  if (!already && monPlace(s, uid) !== MonPlace.Ranch) return 'Solo puede ir desde el rancho.'
  const minLevel = cycleBoss(rotation, cycleAt(now)).minLevel ?? 0
  if (mon.level < minLevel) return `Hace falta Nv. ${minLevel} para luchar contra este jefe.`
  if (mon.hp < 1) return `${species(mon.speciesId).name} está debilitado.`
  if (!monKnows(mon, moveId)) return 'No conoce ese ataque.'
  if (!raidMoveAllowed(moveId)) return 'Contra el jefe solo valen ataques de daño.'
  return null
}

/** El Pokémon tal y como entra en la sala: con sus PS de ahora, su ataque y el entrenador `trainer` */
export function raidEntrant(s: GameState, uid: string, moveId: string, trainer = PLAYER_TRAINER): RaidEntrant {
  const mon = findMon(s, uid)!
  const fresh = freshMember({ id: uid, speciesId: mon.speciesId, level: mon.level, stars: mon.stars, nature: mon.nature, shiny: mon.shiny, perks: monPerks(s, mon), moveId })
  return { member: { ...fresh, hpFraction: mon.hp / maxHp(mon) }, trainer }
}

/**
 * Manda al Pokémon con ese ataque a la sala de la rotación (o cambia el Pokémon o el ataque del que ya estaba). Se
 * sienta en la sala de la partida y se pide sitio al servidor (net/raidSync.ts); sin él, se queda en la local con bots.
 * Con la pelea ya empezada, entra en ella en el sitio de un bot (raidLateJoin.ts)
 */
export function joinRaid(s: GameState, rotation: RaidRotation, uid: string, moveId: string, now: number, rng: Rng = Math.random) {
  if (raidBlocker(s, rotation, uid, moveId, now)) return
  if (stageAt(cycleAt(now), now) === RaidStage.Fight) return joinFight(s, rotation, uid, moveId, now)
  const own = s.raids[rotation]
  const room = own?.room ?? newRoom(localRoomId(rotation, cycleAt(now)), rotation, cycleAt(now), Math.floor(rng() * 2 ** 31))
  // Con servidor, el entrenador lleva su apodo: se le deja
  const trainer = room.entrants.find((e) => e.member.id === own?.uid)?.trainer
  if (!seatEntrant(room, raidEntrant(s, uid, moveId, trainer), own?.uid ?? null)) return
  const link = own?.link === RaidLink.Local ? RaidLink.Local : RaidLink.Joining
  s.raids[rotation] = { room, uid, link, pendingPick: null, pendingCrit: false, pendingJoin: false }
}

/** Entra en la pelea ya empezada: en la sala local con bots, puesta al día, y se pide sitio al servidor */
function joinFight(s: GameState, rotation: RaidRotation, uid: string, moveId: string, now: number) {
  const cycle = cycleAt(now)
  const room = lateLocalRoom(localRoomId(rotation, cycle), rotation, cycle, now)
  if (!seatLate(room, raidEntrant(s, uid, moveId), now)) return
  s.raids[rotation] = { room, uid, link: RaidLink.Joining, pendingPick: null, pendingCrit: false, pendingJoin: true }
}

/** Sale de la sala abierta y su Pokémon vuelve al rancho; con servidor, se le avisará (`roomsToLeave`) */
export function leaveRaid(s: GameState, rotation: RaidRotation) {
  const own = s.raids[rotation]
  if (!own || !unseat(own.room, own.uid)) return
  if (own.link !== RaidLink.Local) s.roomsToLeave = [...new Set([...s.roomsToLeave, own.room.id])]
  s.raids[rotation] = null
}

import type { Rng } from '../../core/random'
import { IncursionPhase } from '../../incursion/activeIncursion'
import type { MemberState } from '../../incursion/fighter'
import { TAP_CLOSE_DELAY_MS } from '../../incursion/online/sharedIncursion'
import { settleGroupTaps } from '../../incursion/tapSettle'
import type { MovePick } from '../../incursion/tapWindow'
import { mayKnow } from '../../incursion/tms'
import { fightProgress, raidSource } from '../raidFight'
import { fightDue, startFight } from '../raidLobby'
import { lateJoinBlocker, seatLate } from '../raidLateJoin'
import { raidMoveAllowed } from '../raidMoves'
import { newRoom, roomBoss, roomFull, seatEntrant, unseat, type RaidRoom } from '../raidRoom'
import { RaidStage, stageAt } from '../raidSchedule'
import type { RaidRotation, RoomView } from './protocol'

// Una sala de la pestaña Raids tal y como la guarda el servidor: la sala de siempre (raidRoom.ts) más quién es cada
// jugador y lo que han decidido para la próxima ventana de toques. El servidor no juega la pelea: cierra cada ventana
// al pasar su hora con lo que haya llegado, y cada móvil simula lo mismo con las mismas órdenes.

/** El Pokémon que tiene en la sala cada jugador (uno por sala) */
export interface RaidSeat {
  playerId: string
  memberId: string
}

export interface SharedRaid extends RaidRoom {
  seats: RaidSeat[]
  /** Pokémon de los jugadores que han llegado a los toques en la ventana abierta */
  tapPending: string[]
  /** Cambios de ataque y objetivo que entrarán en la próxima ventana, por Pokémon */
  pickPending: Record<string, MovePick>
  /** Pokémon de los jugadores que han acertado el toque crítico y aún no ha llegado su ventana */
  critPending: string[]
  /** Pokémon de los jugadores que han entrado en la pelea ya empezada y aún no ha llegado su ventana (sin él, ninguno) */
  joinPending?: string[]
  /** Falta apuntar en el ranking el daño al jefe (ver damageTally.ts) */
  damagePending: boolean
  updatedAt: number
}

export const createShared = (id: string, rotation: RaidRotation, cycle: number, now: number, rng: Rng): SharedRaid => ({
  ...newRoom(id, rotation, cycle, Math.floor(rng() * 2 ** 31)),
  seats: [],
  tapPending: [],
  pickPending: {},
  critPending: [],
  joinPending: [],
  damagePending: true,
  updatedAt: now,
})

const seatOf = (room: SharedRaid, playerId: string) => room.seats.find((s) => s.playerId === playerId)

/**
 * La sala a la que va el jugador: la suya si ya está en una; si no, la que tenga más jugadores y sitio (con la pelea
 * empezada, una en la que aún se pueda entrar, ver raidLateJoin.ts); null si hay que abrir otra
 */
export function roomFor(rooms: SharedRaid[], playerId: string, now: number): SharedRaid | null {
  const own = rooms.find((r) => seatOf(r, playerId))
  if (own) return own
  const lobby = (r: SharedRaid) => stageAt(r.cycle, now) === RaidStage.Lobby
  const fits = (r: SharedRaid) => (lobby(r) ? !r.fight && !roomFull(r) : lateJoinBlocker(r, now) === null)
  return [...rooms].sort((a, b) => b.entrants.length - a.entrants.length).find(fits) ?? null
}

/**
 * Sienta al Pokémon del jugador en la sala abierta (si ya tenía uno, lo cambia por este: otro Pokémon u otro ataque);
 * al llenarse, el último bot en llegar se va. false si la sala ya no admite (empezó la pelea o está llena de jugadores)
 * o si ese Pokémon es de otro jugador
 */
export function joinShared(room: SharedRaid, playerId: string, nickname: string, member: MemberState, now: number): boolean {
  if (!raidMoveAllowed(member.moveId)) return false
  if (stageAt(room.cycle, now) !== RaidStage.Lobby) return joinFightShared(room, playerId, nickname, member, now)
  if (room.fight) return false
  const seat = seatOf(room, playerId)
  if (room.seats.some((s) => s.memberId === member.id && s.playerId !== playerId)) return false
  if (!seatEntrant(room, { member, trainer: nickname }, seat?.memberId ?? null)) return false
  if (seat) seat.memberId = member.id
  else room.seats.push({ playerId, memberId: member.id })
  return true
}

/**
 * Entra en la pelea ya empezada (sin Pokémon suyo en la sala): en la próxima ventana ocupa el sitio de un bot. false si
 * ya no se puede (ver raidLateJoin.ts). La sala ya debe estar al día (advanceShared)
 */
function joinFightShared(room: SharedRaid, playerId: string, nickname: string, member: MemberState, now: number): boolean {
  if (seatOf(room, playerId) || !seatLate(room, { member, trainer: nickname }, now)) return false
  room.seats.push({ playerId, memberId: member.id })
  room.joinPending = [...(room.joinPending ?? []), member.id]
  return true
}

/** Saca de la sala abierta al Pokémon del jugador; false si la pelea ya ha empezado */
export function leaveShared(room: SharedRaid, playerId: string): boolean {
  const seat = seatOf(room, playerId)
  if (!seat || !unseat(room, seat.memberId)) return false
  room.seats = room.seats.filter((s) => s !== seat)
  return true
}

/** Pone la sala al día: a su hora empieza la pelea, y cada ventana de toques pasada se cierra con lo que llegó a tiempo */
export function advanceShared(room: SharedRaid, now: number) {
  room.updatedAt = now
  if (fightDue(room, now)) startFight(room)
  if (!room.fight) return
  const joins = room.entrants.filter((e) => room.joinPending?.includes(e.member.id)).map((e) => e.member)
  const pending = { boosted: room.tapPending, picks: room.pickPending, crits: room.critPending, ...(joins.length ? { joins } : {}) }
  if (!settleGroupTaps(room.fight, raidSource(roomBoss(room)), now, TAP_CLOSE_DELAY_MS, pending)) return
  Object.assign(room, { tapPending: [], pickPending: {}, critPending: [], joinPending: [] })
}

/** El Pokémon del jugador en la pelea en marcha (no terminada; también si acaba de entrar); null si no está */
function fighting(room: SharedRaid, playerId: string, now: number): MemberState | null {
  const id = seatOf(room, playerId)?.memberId
  if (!room.fight || !id || fightProgress(room.fight, roomBoss(room), now).phase === IncursionPhase.Finished) return null
  return room.entrants.find((e) => e.member.id === id)?.member ?? null
}

/** El jugador ha llegado a los toques en la ventana `turn`: vale si es la abierta */
export function tapShared(room: SharedRaid, playerId: string, turn: number, now: number) {
  const member = fighting(room, playerId, now)
  if (member && room.fight!.orders[0].turns.length === turn) room.tapPending = [...new Set([...room.tapPending, member.id])]
}

/** El jugador cambia el ataque de su Pokémon y a quién lo dirige: entra en la próxima ventana (si conoce el ataque) */
export function pickShared(room: SharedRaid, playerId: string, pick: MovePick, now: number) {
  const member = fighting(room, playerId, now)
  if (member && mayKnow(member.speciesId, member.level, pick.moveId) && raidMoveAllowed(pick.moveId)) room.pickPending = { ...room.pickPending, [member.id]: pick }
}

/** El jugador ha acertado el toque crítico: su primer golpe del turno siguiente será crítico */
export function critShared(room: SharedRaid, playerId: string, now: number) {
  const member = fighting(room, playerId, now)
  if (member) room.critPending = [...new Set([...room.critPending, member.id])]
}

/** La sala vista por uno de sus jugadores (sin los ids de los demás); null si no está en ella */
export function roomView(room: SharedRaid, playerId: string, now: number): RoomView | null {
  const seat = seatOf(room, playerId)
  if (!seat) return null
  const { id, rotation, cycle, seed, entrants, fight } = room
  return {
    room: { id, rotation, cycle, seed, entrants, fight },
    you: seat.memberId,
    yourPick: room.pickPending[seat.memberId] ?? null,
    yourCrit: room.critPending.includes(seat.memberId),
    yourJoin: room.joinPending?.includes(seat.memberId) ?? false,
    serverNow: now,
  }
}

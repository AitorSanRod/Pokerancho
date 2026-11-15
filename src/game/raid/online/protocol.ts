import type { MemberState } from '../../incursion/fighter'
import type { MovePick } from '../../incursion/tapWindow'
import type { RaidRoom } from '../raidRoom'

// Lo que se dicen el juego y el servidor de los jefes de la pestaña Raids (worker/raid.ts). Sin cuentas: cada
// dispositivo se identifica con un id anónimo al azar y un apodo (el mismo de las incursiones).

/**
 * Rotaciones de jefes de la pestaña Raids, a la vez y con el mismo calendario (raidSchedule.ts): una sigue el orden de
 * RAID_BOSSES y la de difíciles elige al azar de HARD_RAID_BOSSES (más nivel y mejores premios, ver rotationBosses.ts),
 * para que el jugador pueda escoger entre dos jefes. `Hard` conserva el valor 'random' de cuando era «Al azar»: con
 * él se guardan las partidas y los ids de las salas
 */
export const RaidRotation = { Ordered: 'ordered', Hard: 'random' } as const
export type RaidRotation = (typeof RaidRotation)[keyof typeof RaidRotation]
/** Las rotaciones en el orden en que se enseñan */
export const RAID_ROTATIONS: RaidRotation[] = [RaidRotation.Ordered, RaidRotation.Hard]

export const RaidAction = {
  /** Lo que hay en la pestaña: cuántos jugadores esperan a cada jefe */
  Board: 'board',
  /** Entrar en la sala abierta de una rotación (o cambiar el Pokémon o el ataque del que ya está) o en su pelea ya empezada */
  Join: 'join',
  /** Salir de la sala abierta */
  Leave: 'leave',
  /** Ponerse al día con la sala */
  Sync: 'sync',
  /** Ha llegado a los toques en una ventana (ver incursion/tapWindow.ts) */
  Tap: 'tap',
  /** Cambia el ataque de su Pokémon y a quién lo dirige, desde la próxima ventana */
  Pick: 'pick',
  /** Ha acertado el toque crítico en un golpe: su primer golpe del turno siguiente será crítico */
  Crit: 'crit',
} as const
export type RaidAction = (typeof RaidAction)[keyof typeof RaidAction]

interface PlayerRequest {
  playerId: string
  nickname: string
}

export interface BoardRequest extends PlayerRequest {
  action: typeof RaidAction.Board
}

export interface JoinRequest extends PlayerRequest {
  action: typeof RaidAction.Join
  rotation: RaidRotation
  /** Su Pokémon, con el uid como id, sus PS y su ataque; si ya tenía otro en la sala, lo cambia por este */
  member: MemberState
}

interface RoomRequestBase extends PlayerRequest {
  roomId: string
}
export interface LeaveRequest extends RoomRequestBase {
  action: typeof RaidAction.Leave
}
export interface SyncRequest extends RoomRequestBase {
  action: typeof RaidAction.Sync
}
export interface TapRequest extends RoomRequestBase {
  action: typeof RaidAction.Tap
  turn: number
}
export interface PickRequest extends RoomRequestBase {
  action: typeof RaidAction.Pick
  moveId: string
  /** Id del rival o aliado; null: el que toque */
  target: string | null
}
export interface CritRequest extends RoomRequestBase {
  action: typeof RaidAction.Crit
}

export type RoomRequest = LeaveRequest | SyncRequest | TapRequest | PickRequest | CritRequest
export type RaidRequest = BoardRequest | JoinRequest | RoomRequest

/** Una rotación en la pestaña: el ciclo de ahora y cuántos jugadores hay en sus salas */
export interface RotationBoard {
  rotation: RaidRotation
  cycle: number
  players: number
  rooms: number
}

/** La pestaña Raids según el servidor; `serverNow`, su hora real, para que cada móvil cuente igual las esperas */
export interface RaidBoard {
  serverNow: number
  rotations: RotationBoard[]
}

/** La sala vista por uno de sus jugadores; las horas, en el reloj del servidor (`serverNow`) */
export interface RoomView {
  room: RaidRoom
  /** El Pokémon de quien pregunta */
  you: string
  /** Su cambio de ataque que aún no ha llegado a una ventana */
  yourPick: MovePick | null
  /** Su toque crítico acertado que aún no ha llegado a una ventana */
  yourCrit: boolean
  /** Ha entrado en la pelea ya empezada y su Pokémon aún no ha llegado a una ventana (no está luchando todavía) */
  yourJoin: boolean
  serverNow: number
}

/** Respuesta: la pestaña, la sala, o `gone` (esa sala ya no existe, no está en ella o ya no se puede entrar) */
export type RaidResponse = { board: RaidBoard } | { room: RoomView } | { gone: true }

/** Letras como mucho de un apodo */
export const NICKNAME_MAX = 14
/** Apodo de quien aún no ha elegido uno */
export const DEFAULT_NICKNAME = 'Entrenador'

/** Carpeta del almacén con las salas de una rotación en un ciclo (empieza el id de cada una) */
export const channelKey = (rotation: RaidRotation, cycle: number): string => `tab/${rotation}/${cycle}`

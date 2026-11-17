import type { IncursionId } from '../../../data/incursions'
import type { MemberState } from '../fighter'
import type { GroupView } from '../online/protocol'
import type { ScheduleRefusal } from './scheduledIncursion'
import type { ScheduleView } from './scheduleView'

// Lo que se dicen el juego y el servidor sobre las incursiones programadas (worker/incursionSchedule.ts,
// POST /api/incursion-schedule). El jugador va por su id y su apodo, como en los raids.

export const ScheduleAction = {
  /** El tablón (las que aún no han empezado) y las del jugador */
  Board: 'board',
  Create: 'create',
  Join: 'join',
  Leave: 'leave',
  Cancel: 'cancel',
  /** Ponerse al día con una (en la sala, o para liquidar su fianza) */
  Sync: 'sync',
  CheckIn: 'checkin',
  /** Marcar el Pokémon y el ataque con los que se entra */
  Mark: 'mark',
  /** Fijar lo marcado */
  Lock: 'lock',
} as const
export type ScheduleAction = (typeof ScheduleAction)[keyof typeof ScheduleAction]

interface PlayerRequest {
  playerId: string
  nickname: string
}
export interface BoardRequest extends PlayerRequest {
  action: typeof ScheduleAction.Board
}
export interface CreateRequest extends PlayerRequest {
  action: typeof ScheduleAction.Create
  incursionId: IncursionId
  startAt: number
  bond: number
}
interface OneRequest extends PlayerRequest {
  scheduleId: string
}
export interface JoinRequest extends OneRequest {
  action: typeof ScheduleAction.Join
  bond: number
}
export interface MarkRequest extends OneRequest {
  action: typeof ScheduleAction.Mark
  /** La incursión, para comprobar el Pokémon antes de leerla */
  incursionId: IncursionId
  member: MemberState
}
export interface SimpleRequest extends OneRequest {
  action: typeof ScheduleAction.Leave | typeof ScheduleAction.Cancel | typeof ScheduleAction.Sync | typeof ScheduleAction.CheckIn | typeof ScheduleAction.Lock
}
export type ScheduleRequest = BoardRequest | CreateRequest | JoinRequest | MarkRequest | SimpleRequest

/** El tablón: las que aún no han empezado (de cualquiera) y las del jugador (también empezadas, para liquidar fianzas) */
export interface BoardView {
  open: ScheduleView[]
  mine: ScheduleView[]
  serverNow: number
}

export type ScheduleResponse =
  | { board: BoardView }
  /** Con `group` si ya empezó y el jugador está dentro: el grupo de incursión de siempre */
  | { schedule: ScheduleView; group?: GroupView }
  | { refused: ScheduleRefusal }
  | { gone: true }

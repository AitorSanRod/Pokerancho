import type { IncursionId } from '../../../data/incursions'
import type { MemberState } from '../fighter'
import type { LegOrders, Retreat } from '../incursionRun'

// Lo que se dicen el juego y el servidor de incursiones (worker/incursion.ts). El jugador va por su id (el mismo de los
// raids, ver net/identity.ts) y su apodo.

/** Milisegundos que se espera en la cola como mucho: luego el grupo se completa con bots */
export const QUEUE_MAX_MS = 60_000
/** Sin consultar en este tiempo, el jugador sale de la cola (cerró la app) */
export const QUEUE_STALE_MS = 20_000
/** Un grupo sin consultas en este tiempo se borra */
export const GROUP_TTL_MS = 24 * 60 * 60 * 1000

export const IncursionAction = {
  /** Ponerse (o seguir) en la cola; si ya se ha formado el grupo, lo devuelve */
  Queue: 'queue',
  /** Salir de la cola */
  Leave: 'leave',
  /** Ponerse al día con el grupo */
  Sync: 'sync',
  /** Elegir movimiento en la sala de reorganizar */
  Move: 'move',
  /** Seguir ya en la sala de reorganizar (cuando lo dan todos, empieza el tramo) */
  Ready: 'ready',
  /** Votar retirarse o quitar el voto */
  Vote: 'vote',
  /** Ha llegado a los toques en una ventana (ver tapWindow.ts) */
  Tap: 'tap',
} as const
export type IncursionAction = (typeof IncursionAction)[keyof typeof IncursionAction]

interface PlayerRequest {
  playerId: string
  nickname: string
}

export interface QueueRequest extends PlayerRequest {
  action: typeof IncursionAction.Queue
  incursionId: IncursionId
  /** Su Pokémon, con el uid como id */
  member: MemberState
}
export interface LeaveRequest extends PlayerRequest {
  action: typeof IncursionAction.Leave
}
interface GroupRequestBase extends PlayerRequest {
  groupId: string
}
export interface SyncRequest extends GroupRequestBase {
  action: typeof IncursionAction.Sync
}
export interface MoveRequest extends GroupRequestBase {
  action: typeof IncursionAction.Move
  moveId: string
}
export interface ReadyRequest extends GroupRequestBase {
  action: typeof IncursionAction.Ready
}
export interface VoteRequest extends GroupRequestBase {
  action: typeof IncursionAction.Vote
  retreat: boolean
}
export interface TapRequest extends GroupRequestBase {
  action: typeof IncursionAction.Tap
  leg: number
  turn: number
}
export type GroupRequest = SyncRequest | MoveRequest | ReadyRequest | VoteRequest | TapRequest
export type IncursionRequest = QueueRequest | LeaveRequest | GroupRequest

/** En la cola: cuántos esperan esa incursión (con él) y desde cuándo espera él */
export interface QueueView {
  waiting: number
  since: number
}

/** El grupo visto por un jugador; las horas, en el reloj del servidor (`serverNow`) */
export interface GroupView {
  groupId: string
  incursionId: IncursionId
  members: MemberState[]
  orders: LegOrders[]
  legStarts: number[]
  retreat: Retreat | null
  /** Apodo de cada jugador por el id de su Pokémon (los bots no están) */
  nicknames: Record<string, string>
  /** Pokémon de los jugadores que han votado retirarse */
  votes: string[]
  ready: string[]
  nextMoves: Record<string, string>
  /** El Pokémon de quien pregunta */
  you: string
  serverNow: number
}

/** Respuesta: el grupo, la cola, o `gone` (ese grupo ya no existe o no está en él) */
export type IncursionResponse = { group: GroupView } | { queue: QueueView } | { gone: true }

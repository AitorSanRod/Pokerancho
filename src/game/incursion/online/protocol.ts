import type { IncursionId } from '../../../data/incursions'
import type { MemberState } from '../fighter'
import type { LegOrders, Retreat } from '../incursionRun'
import type { MovePick } from '../tapWindow'

// Lo que se dicen el juego y el servidor sobre un grupo de incursión ya formado (worker/incursion.ts). El jugador va
// por su id (el mismo de los raids, ver net/identity.ts) y su apodo. Los grupos se forman a la hora de una incursión
// programada (ver schedule/scheduleProtocol.ts).

/** Un grupo sin consultas en este tiempo se borra */
export const GROUP_TTL_MS = 24 * 60 * 60 * 1000

export const IncursionAction = {
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
  /** Cambia el ataque de su Pokémon y a quién lo dirige, desde la próxima ventana */
  Pick: 'pick',
} as const
export type IncursionAction = (typeof IncursionAction)[keyof typeof IncursionAction]

interface PlayerRequest {
  playerId: string
  nickname: string
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
  /** Lo conseguido en el reto, de 0 a 1 (ver tapChallenge.ts) */
  score: number
}
export interface PickRequest extends GroupRequestBase {
  action: typeof IncursionAction.Pick
  moveId: string
  /** Id del rival o aliado; null: el que toque */
  target: string | null
}
export type GroupRequest = SyncRequest | MoveRequest | ReadyRequest | VoteRequest | TapRequest | PickRequest

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
  /** El cambio de ataque de quien pregunta que aún no ha llegado a una ventana */
  yourPick: MovePick | null
  /** El Pokémon de quien pregunta */
  you: string
  serverNow: number
}

/** Respuesta: el grupo, o `gone` (ese grupo ya no existe o no está en él) */
export type IncursionResponse = { group: GroupView } | { gone: true }

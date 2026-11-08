import { incursion, type IncursionId } from '../../../data/incursions'
import type { Rng } from '../../core/random'
import { incursionProgress, IncursionPhase, regroupEnd, startNextLeg, type IncursionPlan } from '../activeIncursion'
import type { MemberState } from '../fighter'
import { fillWithBots, PARTY_SIZE } from '../party'
import { canLearn } from '../repertoire'
import { retreatPasses } from '../retreatVote'
import { QUEUE_MAX_MS, type GroupView } from './protocol'

// Un grupo de incursión tal y como lo guarda el servidor: la incursión (como en la partida) más quién es cada jugador,
// sus votos, quién está listo y lo que ha elegido cada uno al reorganizar. El servidor no simula combates salvo para
// saber cuándo acaba un tramo; cada móvil los simula igual con las mismas órdenes.

export interface Seat {
  playerId: string
  nickname: string
  /** Id de su Pokémon en `members` (su uid) */
  memberId: string
}

export interface SharedIncursion extends IncursionPlan {
  id: string
  seats: Seat[]
  /** Jugadores (por su id) que han votado retirarse */
  votes: string[]
  /** Jugadores que han dado a seguir en la sala de reorganizar en curso */
  ready: string[]
  /** Movimiento elegido en la sala de reorganizar en curso, por Pokémon */
  nextMoves: Record<string, string>
  updatedAt: number
}

/** Uno en la cola */
export interface Queued {
  playerId: string
  nickname: string
  member: MemberState
  joinedAt: number
}

/**
 * Quiénes forman grupo ya, de los que esperan esa incursión (por orden de llegada): los cinco primeros si los hay; si
 * no, todos si el primero lleva esperando QUEUE_MAX_MS (se completa con bots). Un Pokémon repetido espera al siguiente
 */
export function pickGroup(waiting: Queued[], now: number): Queued[] | null {
  const unique = waiting.filter((q, i) => waiting.findIndex((o) => o.member.id === q.member.id) === i).slice(0, PARTY_SIZE)
  if (unique.length === PARTY_SIZE) return unique
  return unique.length > 0 && now - unique[0].joinedAt >= QUEUE_MAX_MS ? unique : null
}

export function formGroup(id: string, incursionId: IncursionId, players: Queued[], now: number, rng: Rng): SharedIncursion {
  return {
    id,
    incursionId,
    members: fillWithBots(incursion(incursionId), players.map((p) => p.member), rng),
    orders: [{ seed: Math.floor(rng() * 2 ** 31), moves: {} }],
    legStarts: [now],
    retreat: null,
    seats: players.map((p) => ({ playerId: p.playerId, nickname: p.nickname, memberId: p.member.id })),
    votes: [],
    ready: [],
    nextMoves: {},
    updatedAt: now,
  }
}

const seatOf = (g: SharedIncursion, playerId: string) => g.seats.find((s) => s.playerId === playerId)

function nextLeg(g: SharedIncursion, at: number) {
  startNextLeg(g, at, g.nextMoves)
  g.nextMoves = {}
  g.ready = []
}

/** Pone el grupo al día: cada sala de reorganizar cuyo plazo ha acabado da paso al tramo siguiente */
export function advanceShared(g: SharedIncursion, now: number) {
  g.updatedAt = now
  for (let p = incursionProgress(g, now); p.phase === IncursionPhase.Regroup && p.regroupMsLeft === 0; p = incursionProgress(g, now)) {
    nextLeg(g, regroupEnd(g, p))
  }
}

const inRegroup = (g: SharedIncursion, now: number) => incursionProgress(g, now).phase === IncursionPhase.Regroup

/** En la sala de reorganizar: el movimiento del jugador para el tramo siguiente, si lo conoce */
export function chooseShared(g: SharedIncursion, playerId: string, moveId: string, now: number) {
  const member = g.members.find((m) => m.id === seatOf(g, playerId)?.memberId)
  if (member && inRegroup(g, now) && canLearn(member.speciesId, member.level, moveId)) g.nextMoves[member.id] = moveId
}

/** En la sala de reorganizar: el jugador ya está; cuando lo están todos, empieza el tramo siguiente */
export function readyShared(g: SharedIncursion, playerId: string, now: number) {
  if (!seatOf(g, playerId) || !inRegroup(g, now)) return
  if (!g.ready.includes(playerId)) g.ready.push(playerId)
  if (g.seats.every((s) => g.ready.includes(s.playerId))) nextLeg(g, now)
}

/** Vota retirarse (o quita el voto); con la mitad de los jugadores, la incursión acaba en este momento */
export function voteShared(g: SharedIncursion, playerId: string, retreat: boolean, now: number) {
  const p = incursionProgress(g, now)
  if (!seatOf(g, playerId) || p.phase === IncursionPhase.Finished) return
  g.votes = retreat ? [...new Set([...g.votes, playerId])] : g.votes.filter((v) => v !== playerId)
  if (retreatPasses(g.votes.length, g.seats.length)) g.retreat = { leg: p.leg, atMs: p.legMs }
}

const memberOf = (g: SharedIncursion, playerIds: string[]) =>
  g.seats.filter((s) => playerIds.includes(s.playerId)).map((s) => s.memberId)

/** El grupo visto por uno de sus jugadores; null si no está en él */
export function groupView(g: SharedIncursion, playerId: string, now: number): GroupView | null {
  const seat = seatOf(g, playerId)
  if (!seat) return null
  return {
    groupId: g.id,
    incursionId: g.incursionId,
    members: g.members,
    orders: g.orders,
    legStarts: g.legStarts,
    retreat: g.retreat,
    nicknames: Object.fromEntries(g.seats.map((s) => [s.memberId, s.nickname])),
    votes: memberOf(g, g.votes),
    ready: memberOf(g, g.ready),
    nextMoves: g.nextMoves,
    you: seat.memberId,
    serverNow: now,
  }
}

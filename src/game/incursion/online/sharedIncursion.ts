import { incursion, type IncursionId } from '../../../data/incursions'
import type { Rng } from '../../core/random'
import { incursionProgress, IncursionPhase, regroupEnd, startNextLeg, type IncursionPlan } from '../activeIncursion'
import type { MemberState } from '../fighter'
import { fillWithBots, PARTY_SIZE } from '../party'
import { mayKnow } from '../tms'
import { retreatPasses } from '../retreatVote'
import { settleTaps } from '../tapSettle'
import { TAP_SETTLE_MS, type MovePick } from '../tapWindow'
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
  /** Pokémon de los jugadores que han llegado a los toques en la ventana abierta (ver tapWindow.ts) */
  tapPending: string[]
  /** Cambios de ataque y objetivo que entrarán en la próxima ventana, por Pokémon (ver movePicks.ts) */
  pickPending: Record<string, MovePick>
  /** Falta apuntar en el ranking el daño a los jefes (ver bossDamage.ts); los grupos de antes no lo llevan y no cuentan */
  damagePending?: boolean
  updatedAt: number
}

/**
 * Milisegundos tras acabar una ventana de toques en los que aún se aceptan avisos (lo que tardan en llegar); luego se
 * cierra. Menos que TAP_SETTLE_MS, para que los móviles se enteren antes de que empiece el turno
 */
export const TAP_CLOSE_DELAY_MS = Math.round(TAP_SETTLE_MS / 2)

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
    orders: [{ seed: Math.floor(rng() * 2 ** 31), moves: {}, turns: [] }],
    legStarts: [now],
    retreat: null,
    seats: players.map((p) => ({ playerId: p.playerId, nickname: p.nickname, memberId: p.member.id })),
    votes: [],
    ready: [],
    nextMoves: {},
    tapPending: [],
    pickPending: {},
    damagePending: true,
    updatedAt: now,
  }
}

const seatOf = (g: SharedIncursion, playerId: string) => g.seats.find((s) => s.playerId === playerId)

function nextLeg(g: SharedIncursion, at: number) {
  startNextLeg(g, at, g.nextMoves)
  g.nextMoves = {}
  g.ready = []
  g.tapPending = []
}

/**
 * Pone el grupo al día: cierra las ventanas de toques ya pasadas (la abierta, con quienes llegaron a tiempo) y cada sala
 * de reorganizar cuyo plazo ha acabado da paso al tramo siguiente
 */
export function advanceShared(g: SharedIncursion, now: number) {
  g.updatedAt = now
  for (;;) {
    if (settleTaps(g, now, TAP_CLOSE_DELAY_MS, { boosted: g.tapPending ?? [], picks: g.pickPending ?? {} })) {
      g.tapPending = []
      g.pickPending = {}
    }
    const p = incursionProgress(g, now)
    if (p.phase !== IncursionPhase.Regroup || p.regroupMsLeft > 0) return
    nextLeg(g, regroupEnd(g, p))
  }
}

/** El jugador ha llegado a los toques en la ventana `turn` del tramo `leg`: vale si es la abierta y llega a tiempo */
export function tapShared(g: SharedIncursion, playerId: string, leg: number, turn: number, now: number) {
  const memberId = seatOf(g, playerId)?.memberId
  const waiting = incursionProgress(g, now)
  const open = waiting.leg === leg && (g.orders[leg]?.turns?.length ?? 0) === turn
  if (!memberId || !open || waiting.phase === IncursionPhase.Finished) return
  g.tapPending = [...new Set([...(g.tapPending ?? []), memberId])]
}

/** El jugador cambia el ataque de su Pokémon y a quién lo dirige: entra en la próxima ventana (si conoce el ataque) */
export function pickShared(g: SharedIncursion, playerId: string, pick: MovePick, now: number) {
  const member = g.members.find((m) => m.id === seatOf(g, playerId)?.memberId)
  if (!member || incursionProgress(g, now).phase === IncursionPhase.Finished) return
  if (mayKnow(member.speciesId, member.level, pick.moveId)) g.pickPending = { ...g.pickPending, [member.id]: pick }
}

const inRegroup = (g: SharedIncursion, now: number) => incursionProgress(g, now).phase === IncursionPhase.Regroup

/** En la sala de reorganizar: el movimiento del jugador para el tramo siguiente, si lo conoce */
export function chooseShared(g: SharedIncursion, playerId: string, moveId: string, now: number) {
  const member = g.members.find((m) => m.id === seatOf(g, playerId)?.memberId)
  if (member && inRegroup(g, now) && mayKnow(member.speciesId, member.level, moveId)) g.nextMoves[member.id] = moveId
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
    yourPick: g.pickPending?.[seat.memberId] ?? null,
    you: seat.memberId,
    serverNow: now,
  }
}

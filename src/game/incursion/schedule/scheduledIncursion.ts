import type { IncursionId } from '../../../data/incursions'
import type { MemberState } from '../fighter'
import { PARTY_SIZE } from '../party'
import {
  isPending,
  MAX_CREATED,
  MAX_JOINED,
  SCHEDULE_GAP_MS,
  ScheduleCancel,
  schedulePhase,
  SchedulePhase,
  isValidSlot,
  type ScheduleCancel as ScheduleCancelType,
} from './scheduleRules'

// Una incursión programada tal y como la guarda el servidor, y lo que se puede hacer con ella antes de la sala: crear,
// aceptar, darse de baja y cancelar. Lo de la sala está en scheduleRoom.ts y el comienzo, en scheduleStart.ts.

/** Un hueco ocupado por un jugador */
export interface ScheduleSeat {
  playerId: string
  nickname: string
  /** Fianza que dice haber dejado su móvil (₽) */
  bond: number
  joinedAt: number
  /** Ha hecho el checkin en la sala */
  checkedIn: boolean
  /** Pokémon y ataque marcados en la sala (instantánea, con el uid como id); null sin marcar */
  member: MemberState | null
  /** Ha pulsado «Fijar» */
  locked: boolean
}

export interface ScheduledIncursion {
  id: string
  incursionId: IncursionId
  startAt: number
  creatorId: string
  /** Por orden de aceptación; el primero, el creador */
  seats: ScheduleSeat[]
  cancelledBy: ScheduleCancelType | null
  /** Grupo de incursión formado al empezar */
  groupId: string | null
  updatedAt: number
}

/** Por qué no se ha podido hacer algo */
export const ScheduleRefusal = {
  Full: 'full',
  AlreadyIn: 'already-in',
  NotIn: 'not-in',
  TooManyCreated: 'too-many-created',
  TooManyJoined: 'too-many-joined',
  Overlap: 'overlap',
  BadSlot: 'bad-slot',
  NotCreator: 'not-creator',
  WrongPhase: 'wrong-phase',
  Locked: 'locked',
  BadMember: 'bad-member',
} as const
export type ScheduleRefusal = (typeof ScheduleRefusal)[keyof typeof ScheduleRefusal]

/** Quién la pide: su id de jugador, su apodo y la fianza que deja */
export interface ScheduleJoiner {
  playerId: string
  nickname: string
  bond: number
}

export const seatOf = (sched: ScheduledIncursion, playerId: string): ScheduleSeat | undefined => sched.seats.find((s) => s.playerId === playerId)

/** Topes y separación: `mine` son las incursiones programadas en las que ya está el jugador */
function limitsRefusal(playerId: string, startAt: number, creating: boolean, mine: ScheduledIncursion[], now: number): ScheduleRefusal | null {
  const pending = mine.filter((m) => isPending(schedulePhase(m, now)))
  const created = pending.filter((m) => m.creatorId === playerId).length
  if (creating && created >= MAX_CREATED) return ScheduleRefusal.TooManyCreated
  if (!creating && pending.length - created >= MAX_JOINED) return ScheduleRefusal.TooManyJoined
  return pending.some((m) => Math.abs(m.startAt - startAt) < SCHEDULE_GAP_MS) ? ScheduleRefusal.Overlap : null
}

const newSeat = (who: ScheduleJoiner, now: number): ScheduleSeat => ({ ...who, joinedAt: now, checkedIn: false, member: null, locked: false })

/** Crea la incursión programada con el creador en el primer hueco; o por qué no se puede */
export function createSchedule(
  id: string,
  incursionId: IncursionId,
  startAt: number,
  who: ScheduleJoiner,
  mine: ScheduledIncursion[],
  now: number,
): ScheduledIncursion | ScheduleRefusal {
  if (!isValidSlot(startAt, now)) return ScheduleRefusal.BadSlot
  const refusal = limitsRefusal(who.playerId, startAt, true, mine, now)
  if (refusal) return refusal
  return { id, incursionId, startAt, creatorId: who.playerId, seats: [newSeat(who, now)], cancelledBy: null, groupId: null, updatedAt: now }
}

/** Ocupa un hueco libre (antes de abrir la sala) */
export function joinSchedule(sched: ScheduledIncursion, who: ScheduleJoiner, mine: ScheduledIncursion[], now: number): ScheduleRefusal | null {
  const phase = schedulePhase(sched, now)
  if (phase !== SchedulePhase.Open && phase !== SchedulePhase.Committed) return ScheduleRefusal.WrongPhase
  if (seatOf(sched, who.playerId)) return ScheduleRefusal.AlreadyIn
  if (sched.seats.length >= PARTY_SIZE) return ScheduleRefusal.Full
  const refusal = limitsRefusal(who.playerId, sched.startAt, false, mine, now)
  if (refusal) return refusal
  sched.seats.push(newSeat(who, now))
  return null
}

/** Se da de baja (no el creador) mientras aún se puede con la fianza devuelta */
export function leaveSchedule(sched: ScheduledIncursion, playerId: string, now: number): ScheduleRefusal | null {
  if (!seatOf(sched, playerId)) return ScheduleRefusal.NotIn
  if (playerId === sched.creatorId) return ScheduleRefusal.NotCreator
  if (schedulePhase(sched, now) !== SchedulePhase.Open) return ScheduleRefusal.WrongPhase
  sched.seats = sched.seats.filter((s) => s.playerId !== playerId)
  return null
}

/** El creador la cancela mientras aún se puede (CANCEL_DEADLINE_MS antes del comienzo): se devuelven todas las fianzas */
export function cancelSchedule(sched: ScheduledIncursion, playerId: string, now: number): ScheduleRefusal | null {
  if (playerId !== sched.creatorId) return ScheduleRefusal.NotCreator
  if (schedulePhase(sched, now) !== SchedulePhase.Open) return ScheduleRefusal.WrongPhase
  sched.cancelledBy = ScheduleCancel.Creator
  return null
}

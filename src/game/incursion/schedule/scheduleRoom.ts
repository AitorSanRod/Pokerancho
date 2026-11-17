import { incursion } from '../../../data/incursions'
import { canEnter } from '../entry'
import type { MemberState } from '../fighter'
import { mayKnow } from '../tms'
import { ScheduleRefusal, seatOf, type ScheduledIncursion, type ScheduleSeat } from './scheduledIncursion'
import { schedulePhase, SchedulePhase } from './scheduleRules'

// La sala del checkin, en el servidor: abre CHECKIN_OPEN_MS antes del comienzo. Cada apuntado hace el checkin, marca
// su Pokémon y su ataque (tantas veces como quiera) y puede fijarlos; a la hora se entra con lo marcado.

/** El hueco del jugador si la sala está abierta y está apuntado; o por qué no */
function roomSeat(sched: ScheduledIncursion, playerId: string, now: number): ScheduleSeat | ScheduleRefusal {
  if (schedulePhase(sched, now) !== SchedulePhase.CheckIn) return ScheduleRefusal.WrongPhase
  return seatOf(sched, playerId) ?? ScheduleRefusal.NotIn
}

const isRefusal = (v: ScheduleSeat | ScheduleRefusal): v is ScheduleRefusal => typeof v === 'string'

export function checkInSchedule(sched: ScheduledIncursion, playerId: string, now: number): ScheduleRefusal | null {
  const seat = roomSeat(sched, playerId, now)
  if (isRefusal(seat)) return seat
  seat.checkedIn = true
  return null
}

/** El Pokémon puede entrar en esta incursión: su nivel y un ataque que conoce */
const fits = (sched: ScheduledIncursion, m: MemberState) => canEnter(incursion(sched.incursionId), m.level) && mayKnow(m.speciesId, m.level, m.moveId)

/** Marca (o cambia) el Pokémon y el ataque con los que entrará, si no ha fijado */
export function markSchedule(sched: ScheduledIncursion, playerId: string, member: MemberState, now: number): ScheduleRefusal | null {
  const seat = roomSeat(sched, playerId, now)
  if (isRefusal(seat)) return seat
  if (!seat.checkedIn) return ScheduleRefusal.NotIn
  if (seat.locked) return ScheduleRefusal.Locked
  if (!fits(sched, member)) return ScheduleRefusal.BadMember
  seat.member = member
  return null
}

/** Fija lo marcado: ya no se puede cambiar */
export function lockSchedule(sched: ScheduledIncursion, playerId: string, now: number): ScheduleRefusal | null {
  const seat = roomSeat(sched, playerId, now)
  if (isRefusal(seat)) return seat
  if (!seat.checkedIn || !seat.member) return ScheduleRefusal.NotIn
  seat.locked = true
  return null
}

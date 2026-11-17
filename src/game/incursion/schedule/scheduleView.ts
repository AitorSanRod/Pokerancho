import type { IncursionId } from '../../../data/incursions'
import { seatOf, type ScheduledIncursion } from './scheduledIncursion'
import { schedulePhase, type ScheduleCancel, type SchedulePhase } from './scheduleRules'
import { bondShares, isSettled } from './scheduleStart'

// Una incursión programada vista por un jugador: lo de todos (sin la fianza de los demás) y lo suyo.

/** Un hueco visto desde fuera */
export interface SeatView {
  nickname: string
  checkedIn: boolean
  locked: boolean
  /** Pokémon marcado en la sala (especie y nivel); null sin marcar */
  speciesId: number | null
  level: number | null
  shiny: boolean
}

/** Lo del jugador que pregunta */
export interface YourSeat {
  bond: number
  checkedIn: boolean
  locked: boolean
  /** Pokémon y ataque que el servidor tiene marcados para él */
  memberId: string | null
  moveId: string | null
}

export interface ScheduleView {
  id: string
  incursionId: IncursionId
  startAt: number
  /** Apodo del creador */
  creator: string
  /** Quien pregunta es el creador */
  yoursToCancel: boolean
  seats: SeatView[]
  phase: SchedulePhase
  /** null si no está apuntado */
  you: YourSeat | null
  /** Su parte del reparto de fianzas, cuando ya se ha decidido (empezada o cancelada por falta de Pokémon); si no, null */
  shares: number | null
  cancelledBy: ScheduleCancel | null
  serverNow: number
}

export function scheduleView(sched: ScheduledIncursion, playerId: string, now: number): ScheduleView {
  const mine = seatOf(sched, playerId)
  const settled = isSettled(sched)
  return {
    id: sched.id,
    incursionId: sched.incursionId,
    startAt: sched.startAt,
    creator: sched.seats.find((s) => s.playerId === sched.creatorId)?.nickname ?? '',
    yoursToCancel: sched.creatorId === playerId,
    seats: sched.seats.map((s) => ({
      nickname: s.nickname,
      checkedIn: s.checkedIn,
      locked: s.locked,
      speciesId: s.member?.speciesId ?? null,
      level: s.member?.level ?? null,
      shiny: s.member?.shiny === true,
    })),
    phase: schedulePhase(sched, now),
    you: mine
      ? { bond: mine.bond, checkedIn: mine.checkedIn, locked: mine.locked, memberId: mine.member?.id ?? null, moveId: mine.member?.moveId ?? null }
      : null,
    shares: settled && mine ? (bondShares(sched)[playerId] ?? 0) : null,
    cancelledBy: sched.cancelledBy,
    serverNow: now,
  }
}

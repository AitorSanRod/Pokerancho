import type { Rng } from '../../core/random'
import { formGroup, type SharedIncursion } from '../online/sharedIncursion'
import type { ScheduledIncursion } from './scheduledIncursion'
import { ScheduleCancel } from './scheduleRules'

// A la hora de comienzo: se forma el grupo con quienes hicieron el checkin y marcaron Pokémon (el resto, bots) y se
// reparten las fianzas de los que no se presentaron entre los que sí.

/** Ya se decidió qué pasa con ella: empezó (grupo formado) o se canceló */
export const isSettled = (sched: ScheduledIncursion): boolean => sched.groupId !== null || sched.cancelledBy !== null

/**
 * Si ya es la hora y aún no se ha decidido: forma el grupo (empieza a la hora de comienzo, no a la de la petición, para
 * que todos vean lo mismo) o, si nadie tiene Pokémon marcado, la cancela. Devuelve el grupo nuevo, si lo hay
 */
export function startSchedule(sched: ScheduledIncursion, groupId: string, now: number, rng: Rng): SharedIncursion | null {
  if (now < sched.startAt || isSettled(sched)) return null
  const players = sched.seats.filter((s) => s.checkedIn && s.member)
  if (players.length === 0) {
    sched.cancelledBy = ScheduleCancel.Nobody
    return null
  }
  sched.groupId = groupId
  return formGroup(
    groupId,
    sched.incursionId,
    players.map((s) => ({ playerId: s.playerId, nickname: s.nickname, member: s.member! })),
    sched.startAt,
    rng,
  )
}

/**
 * Lo que recibe cada jugador del reparto: las fianzas de los que no hicieron el checkin, a partes iguales (hacia abajo)
 * entre los que sí. Si la canceló el creador no hay reparto (se devuelven todas)
 */
export function bondShares(sched: ScheduledIncursion): Record<string, number> {
  if (sched.cancelledBy === ScheduleCancel.Creator) return {}
  const present = sched.seats.filter((s) => s.checkedIn)
  const forfeited = sched.seats.filter((s) => !s.checkedIn).reduce((sum, s) => sum + s.bond, 0)
  const share = present.length > 0 ? Math.floor(forfeited / present.length) : 0
  return Object.fromEntries(present.map((s) => [s.playerId, share]))
}

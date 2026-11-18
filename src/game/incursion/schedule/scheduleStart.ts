import type { Rng } from '../../core/random'
import { formGroup, type SharedIncursion } from '../online/sharedIncursion'
import type { ScheduledIncursion } from './scheduledIncursion'
import { MIN_PLAYERS, refundsAll, ScheduleCancel, schedulePhase, SchedulePhase } from './scheduleRules'

// El comienzo: a la hora (o antes, si todos los apuntados fijaron su Pokémon en la sala) se forma el grupo con quienes
// hicieron el checkin y marcaron Pokémon (el resto, bots) y se reparten las fianzas de los que no se presentaron entre
// los que sí. Con menos de MIN_PLAYERS jugadores no empieza: se cancela.

/** Ya se decidió qué pasa con ella: empezó (grupo formado) o se canceló */
export const isSettled = (sched: ScheduledIncursion): boolean => sched.groupId !== null || sched.cancelledBy !== null

/** Sala abierta, al menos MIN_PLAYERS apuntados y todos con su Pokémon fijado: no hace falta esperar a la hora */
const allLocked = (sched: ScheduledIncursion, now: number): boolean =>
  schedulePhase(sched, now) === SchedulePhase.CheckIn && sched.seats.length >= MIN_PLAYERS && sched.seats.every((s) => s.locked && s.member)

/** Le toca decidirse: ya es la hora o todos han fijado su Pokémon */
const isDue = (sched: ScheduledIncursion, now: number): boolean => !isSettled(sched) && (now >= sched.startAt || allLocked(sched, now))

/**
 * Si le toca: forma el grupo (empieza a la hora de comienzo, no a la de la petición, para que todos vean lo mismo; o
 * ahora, si empieza antes porque todos fijaron) o, con menos de MIN_PLAYERS jugadores con Pokémon, la cancela.
 * Devuelve el grupo nuevo, si lo hay
 */
export function startSchedule(sched: ScheduledIncursion, groupId: string, now: number, rng: Rng): SharedIncursion | null {
  if (!isDue(sched, now)) return null
  const players = sched.seats.filter((s) => s.checkedIn && s.member)
  if (players.length < MIN_PLAYERS) {
    sched.cancelledBy = sched.seats.length < MIN_PLAYERS ? ScheduleCancel.Alone : ScheduleCancel.TooFew
    return null
  }
  sched.groupId = groupId
  return formGroup(
    groupId,
    sched.incursionId,
    players.map((s) => ({ playerId: s.playerId, nickname: s.nickname, member: s.member! })),
    Math.min(now, sched.startAt),
    rng,
  )
}

/**
 * Lo que recibe cada jugador del reparto: las fianzas de los que no hicieron el checkin, a partes iguales (hacia abajo)
 * entre los que sí. Si la canceló el creador o nadie más se apuntó no hay reparto (se devuelven todas)
 */
export function bondShares(sched: ScheduledIncursion): Record<string, number> {
  if (refundsAll(sched.cancelledBy)) return {}
  const present = sched.seats.filter((s) => s.checkedIn)
  const forfeited = sched.seats.filter((s) => !s.checkedIn).reduce((sum, s) => sum + s.bond, 0)
  const share = present.length > 0 ? Math.floor(forfeited / present.length) : 0
  return Object.fromEntries(present.map((s) => [s.playerId, share]))
}

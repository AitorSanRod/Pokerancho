import { incursion, type IncursionId } from '../../../data/incursions'
import type { GameState } from '../../core/state'
import { holdMoney, releaseMoney } from '../../core/wallet'
import { canEnter } from '../entry'
import { adoptServerLock, startCheckin } from './scheduleCheckin'
import { ScheduleCancel, SchedulePhase, SCHEDULE_TTL_MS } from './scheduleRules'
import type { ScheduleView } from './scheduleView'

// Las incursiones programadas en la partida: la fianza que el móvil retiene al crear o aceptar una y lo que pasa con ella
// según diga el servidor (devolverla al hacer el checkin, a la baja o al cancelarla; el reparto al empezar). El checkin
// (Pokémon marcado y reservado) está en scheduleCheckin.ts.

/** Fianza retenida por una incursión programada aún sin liquidar */
export interface HeldBond {
  scheduleId: string
  incursionId: IncursionId
  startAt: number
  amount: number
  /** Ya devuelta al hacer el checkin; queda hasta cobrar el reparto */
  refunded: boolean
}

/** Checkin hecho en la sala de una incursión programada */
export interface ScheduleCheckin {
  scheduleId: string
  incursionId: IncursionId
  startAt: number
  /** Pokémon marcado (en `MonPlace.Incursion`, con una llave reservada); null sin llave o sin Pokémon disponible */
  uid: string | null
  moveId: string | null
  locked: boolean
}

export const bondOf = (s: GameState, scheduleId: string): HeldBond | undefined => s.incursionBonds.find((b) => b.scheduleId === scheduleId)

/** Por qué no puede crear ni aceptar esa incursión (null si puede): hace falta un Pokémon con el nivel de entrada */
export function scheduleBlocker(s: GameState, incursionId: IncursionId): string | null {
  const inc = incursion(incursionId)
  return s.owned.some((m) => canEnter(inc, m.level)) ? null : `Ninguno de tus Pokémon tiene el nivel para entrar (Nv. ${inc.minLevel}–${inc.maxLevel}).`
}

/** Retiene la fianza de esa incursión (una sola vez) */
function holdBond(s: GameState, view: ScheduleView, amount: number) {
  if (bondOf(s, view.id)) return
  const held = holdMoney(s, amount)
  s.incursionBonds.push({ scheduleId: view.id, incursionId: view.incursionId, startAt: view.startAt, amount: held, refunded: false })
}

function refund(s: GameState, bond: HeldBond) {
  if (bond.refunded) return
  releaseMoney(s, bond.amount)
  bond.refunded = true
}

/** Liquida la fianza (con lo del reparto) y la quita; sin checkin, se pierde */
function settle(s: GameState, bond: HeldBond, checkedIn: boolean, share: number) {
  if (checkedIn) refund(s, bond)
  releaseMoney(s, share)
  s.incursionBonds = s.incursionBonds.filter((b) => b !== bond)
}

function forget(s: GameState, scheduleId: string) {
  const bond = bondOf(s, scheduleId)
  if (bond) refund(s, bond)
  s.incursionBonds = s.incursionBonds.filter((b) => b.scheduleId !== scheduleId)
  if (s.incursionCheckin?.scheduleId === scheduleId) s.incursionCheckin = null
}

/** Lo que dice el servidor de una incursión programada, en la partida: retener, devolver, liquidar o empezar el checkin */
export function applyScheduleView(s: GameState, view: ScheduleView, now: number) {
  const you = view.you
  const bond = bondOf(s, view.id)
  if (view.cancelledBy === ScheduleCancel.Creator || (!you && bond)) return forget(s, view.id)
  if (!you) return
  if (view.shares !== null) {
    if (bond) settle(s, bond, you.checkedIn, view.shares)
    if (s.incursionCheckin?.scheduleId === view.id) s.incursionCheckin = null
    return
  }
  if (view.phase === SchedulePhase.Open || view.phase === SchedulePhase.Committed) holdBond(s, view, you.bond)
  if (view.phase !== SchedulePhase.CheckIn || !you.checkedIn) return
  if (bond) refund(s, bond)
  if (s.incursionCheckin?.scheduleId !== view.id) startCheckin(s, view, now)
  adoptServerLock(s, view)
}

/** El servidor ya no tiene esa incursión: se devuelve la fianza que no se hubiera devuelto y se olvida */
export const scheduleGone = (s: GameState, scheduleId: string) => forget(s, scheduleId)

/**
 * Sin noticias del servidor durante mucho tiempo (cuando ya la habría olvidado): el checkin se da por perdido (el
 * Pokémon vuelve al rancho) y la fianza se devuelve. Antes, no: quien vuelve tarde aún entra en el grupo que se formó
 */
export function expireSchedules(s: GameState, now: number) {
  if (s.incursionCheckin && now > s.incursionCheckin.startAt + SCHEDULE_TTL_MS) s.incursionCheckin = null
  for (const b of s.incursionBonds.filter((b) => now > b.startAt + SCHEDULE_TTL_MS)) forget(s, b.scheduleId)
}

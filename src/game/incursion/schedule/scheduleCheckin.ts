import type { IncursionId } from '../../../data/incursions'
import { findMon, MonPlace, monPlace, type GameState, type OwnedMon } from '../../core/state'
import { monPerks } from '../../team/perks'
import { byPickOrder } from '../../team/pickOrder'
import { maxHp } from '../../team/stats'
import type { MemberState } from '../fighter'
import { monEntryBlocker } from '../incursionGame'
import { freshMember } from '../party'
import { monRepertoire } from '../repertoire'
import type { ScheduleView } from './scheduleView'

// El checkin en la partida: al hacerlo se marca el primer Pokémon disponible (orden del selector) con su primer ataque;
// hasta la hora se puede cambiar o fijar. Lo marcado queda reservado (no sale de expedición ni a la torre) y también una
// llave de esa incursión (no se puede intercambiar). Al empezar, la partida se une al grupo (online/linkedIncursion.ts).

/** Puede marcar ese Pokémon: en el rancho (o ya marcado), con llave, nivel, PS y el ataque */
export function checkinMonBlocker(s: GameState, incursionId: IncursionId, uid: string, moveId: string): string | null {
  const marked = s.incursionCheckin?.uid === uid
  if (findMon(s, uid) && !marked && monPlace(s, uid) !== MonPlace.Ranch) return 'Tiene que estar en el rancho.'
  return monEntryBlocker(s, incursionId, uid, moveId)
}

const firstMove = (mon: OwnedMon) => monRepertoire(mon)[0]?.id ?? ''

/** El primero de la lista (favoritos y por nivel) que puede entrar, con su primer ataque; null si ninguno */
export function defaultPick(s: GameState, incursionId: IncursionId): { uid: string; moveId: string } | null {
  const mon = byPickOrder(s, s.owned).find((m) => !checkinMonBlocker(s, incursionId, m.uid, firstMove(m)))
  return mon ? { uid: mon.uid, moveId: firstMove(mon) } : null
}

/** Hecho el checkin: se marca el Pokémon por defecto (si tiene llave y alguno puede entrar) */
export function startCheckin(s: GameState, view: ScheduleView, now: number) {
  if (now >= view.startAt) return
  s.incursionCheckin = { scheduleId: view.id, incursionId: view.incursionId, startAt: view.startAt, uid: null, moveId: null, locked: false }
  const pick = defaultPick(s, view.incursionId)
  if (pick) Object.assign(s.incursionCheckin, pick)
}

/** El servidor ya tiene fijado lo marcado (p. ej. se fijó antes de recargar la app): la partida lo adopta */
export function adoptServerLock(s: GameState, view: ScheduleView) {
  const c = s.incursionCheckin
  const you = view.you
  if (!c || c.scheduleId !== view.id || !you?.locked || !you.memberId || !findMon(s, you.memberId)) return
  Object.assign(c, { uid: you.memberId, moveId: you.moveId, locked: true })
}

/** Cambia el Pokémon o el ataque marcados, si no ha fijado */
export function markCheckinMon(s: GameState, uid: string, moveId: string) {
  const c = s.incursionCheckin
  if (!c || c.locked || checkinMonBlocker(s, c.incursionId, uid, moveId)) return
  c.uid = uid
  c.moveId = moveId
}

/** Fija lo marcado: ya no se puede cambiar */
export function lockCheckinMon(s: GameState) {
  const c = s.incursionCheckin
  if (c?.uid) c.locked = true
}

/** El Pokémon marcado tal y como entra en la incursión (para el servidor); null sin marcar */
export function checkinMember(s: GameState): MemberState | null {
  const c = s.incursionCheckin
  const mon = c?.uid ? findMon(s, c.uid) : undefined
  if (!c?.moveId || !mon) return null
  const member = freshMember({ id: mon.uid, speciesId: mon.speciesId, level: mon.level, stars: mon.stars, nature: mon.nature, shiny: mon.shiny, perks: monPerks(s, mon), moveId: c.moveId })
  return { ...member, hpFraction: mon.hp / maxHp(mon) }
}

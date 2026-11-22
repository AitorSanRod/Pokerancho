import { findMon, MonPlace, monPlace, type GameState } from '../../core/state'
import { spendKey } from '../keys'
import type { GroupView } from './protocol'

// La incursión de la partida enlazada con el servidor: entrar en el grupo cuando empieza la incursión programada en la
// que se hizo el checkin (ver schedule/) y ponerse al día con lo que diga. Sin servidor se juega en local con bots
// (incursionGame.ts).

/**
 * Entra con el Pokémon que tiene el servidor (manda lo que llegó a marcar, aunque en el móvil se cambiara después): el
 * reservado por el checkin o uno libre (en el rancho o en la Caja)
 */
function canJoin(s: GameState, view: GroupView): boolean {
  const c = s.incursionCheckin
  if (s.incursion || !c || c.incursionId !== view.incursionId || !findMon(s, view.you)) return false
  const place = monPlace(s, view.you)
  return c.uid === view.you || place === MonPlace.Ranch || place === MonPlace.Box
}

/**
 * Lo que dice el servidor del grupo, en la partida: si hizo el checkin, gasta la llave y entra; si ya estaba en ese
 * grupo, se pone al día. Las horas del servidor se pasan al reloj del móvil. false si no le toca
 */
export function applyGroupView(s: GameState, view: GroupView, now: number): boolean {
  const joining = canJoin(s, view)
  if (!joining && s.incursion?.online?.groupId !== view.groupId) return false
  if (joining) {
    spendKey(s, view.incursionId)
    s.incursionCheckin = null
  }
  const offset = now - view.serverNow
  s.incursion = {
    incursionId: view.incursionId,
    uid: view.you,
    members: view.members,
    orders: view.orders,
    legStarts: view.legStarts.map((t) => t + offset),
    retreat: view.retreat,
    nextMove: view.nextMoves[view.you] ?? null,
    pendingPick: view.yourPick ?? null,
    pendingTap: 0,
    online: { groupId: view.groupId, nicknames: view.nicknames, votes: view.votes, ready: view.ready, nextMoves: view.nextMoves },
  }
  return true
}

/** El servidor ya no tiene el grupo: la incursión sigue en local, con lo que ya se sabía */
export function dropGroup(s: GameState, groupId: string) {
  if (s.incursion?.online?.groupId === groupId) s.incursion.online = null
}

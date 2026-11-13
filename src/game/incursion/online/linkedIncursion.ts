import type { IncursionId } from '../../../data/incursions'
import type { Rng } from '../../core/random'
import { findMon, type GameState } from '../../core/state'
import { monPerks } from '../../team/perks'
import { maxHp } from '../../team/stats'
import { incursionBlocker, startIncursion } from '../incursionGame'
import { spendKey } from '../keys'
import { freshMember } from '../party'
import { IncursionAction, type GroupView, type QueueRequest } from './protocol'

// La incursión de la partida enlazada con el servidor: buscar grupo, pasar al grupo cuando se forma y ponerse al día
// con lo que diga. Sin servidor, lo de la cola se juega en local con bots (incursionGame.ts).

/** Buscando grupo: con qué Pokémon y movimiento, y desde cuándo (ms reales) */
export interface IncursionQueue {
  incursionId: IncursionId
  uid: string
  moveId: string
  since: number
}

/** Se pone a buscar grupo; la llave no se gasta hasta que se forma */
export function enterQueue(s: GameState, id: IncursionId, uid: string, moveId: string, now: number) {
  if (incursionBlocker(s, id, uid, moveId)) return
  s.incursionQueue = { incursionId: id, uid, moveId, since: now }
}

export function leaveQueue(s: GameState) {
  s.incursionQueue = null
}

/** Lo que se manda al servidor para seguir en la cola (sin quién es el jugador); null si no está en ninguna */
export function queueRequest(s: GameState): Pick<QueueRequest, 'action' | 'incursionId' | 'member'> | null {
  const q = s.incursionQueue
  const mon = q && findMon(s, q.uid)
  if (!q || !mon) return null
  const member = { ...freshMember({ id: mon.uid, speciesId: mon.speciesId, level: mon.level, stars: mon.stars, nature: mon.nature, shiny: mon.shiny, perks: monPerks(s, mon), moveId: q.moveId }), hpFraction: mon.hp / maxHp(mon) }
  return { action: IncursionAction.Queue, incursionId: q.incursionId, member }
}

/** Sin servidor: lo que estaba en la cola se juega en local, con bots */
export function playQueueLocally(s: GameState, now: number, rng: Rng = Math.random) {
  const q = s.incursionQueue
  if (!q) return
  s.incursionQueue = null
  startIncursion(s, q.incursionId, q.uid, q.moveId, now, rng)
}

/**
 * Lo que dice el servidor del grupo, en la partida: si estaba en la cola con ese Pokémon, gasta la llave y entra; si
 * ya estaba en ese grupo, se pone al día. Las horas del servidor se pasan al reloj del móvil. false si no le toca
 */
export function applyGroupView(s: GameState, view: GroupView, now: number): boolean {
  const joining = s.incursionQueue?.uid === view.you && s.incursionQueue.incursionId === view.incursionId
  if (!joining && s.incursion?.online?.groupId !== view.groupId) return false
  if (joining) {
    spendKey(s, view.incursionId)
    s.incursionQueue = null
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
    online: { groupId: view.groupId, nicknames: view.nicknames, votes: view.votes, ready: view.ready, nextMoves: view.nextMoves },
  }
  return true
}

/** El servidor ya no tiene el grupo: la incursión sigue en local, con lo que ya se sabía */
export function dropGroup(s: GameState, groupId: string) {
  if (s.incursion?.online?.groupId === groupId) s.incursion.online = null
}

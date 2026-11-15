import { incursionMove } from '../../data/incursionMoves'
import { act } from '../../store/store'
import type { ActiveIncursion } from '../../game/incursion/activeIncursion'
import { setIncursionPick } from '../../game/incursion/incursionPicks'
import type { LegOrders } from '../../game/incursion/incursionRun'
import { PickSide, pickSide } from '../../game/incursion/movePicks'
import type { MovePick } from '../../game/incursion/tapWindow'
import { sendIncursionPick } from '../../net/incursionSync'
import type { SceneMon, SceneState } from './sceneState'

export interface Pick {
  moveId: string
  target: string | null
}

/**
 * Quién lleva su Pokémon en una pelea de grupo (una incursión o un jefe de la pestaña Raids) y cómo cambia su ataque:
 * lo que necesitan la barra de ataques, el diálogo de la «i» y apuntar tocando la escena
 */
export interface FightPilot {
  /** Su Pokémon en la pelea */
  uid: string
  /** Las órdenes de la pelea: dicen a quién va ahora su ataque */
  orders: LegOrders[]
  /** Lo elegido que aún no ha llegado a una ventana de toques */
  pendingPick: MovePick | null
  /** Elegir ataque y objetivo: vale desde el próximo turno */
  choose: (pick: Pick) => void
}

/** El piloto de la incursión en curso: se apunta en la partida y, con servidor, también se le avisa */
export const incursionPilot = (a: ActiveIncursion): FightPilot => ({
  uid: a.uid,
  orders: a.orders,
  pendingPick: a.pendingPick,
  choose: (pick) => {
    act((s) => setIncursionPick(s, pick, Date.now()))
    if (a.online) void sendIncursionPick(pick.moveId, pick.target)
  },
})

const up = (m: SceneMon) => m.hp > 0 && !m.out

/** A quién puede ir un ataque ahora mismo: rivales o aliados en pie, o nadie si no se dirige */
export function pickCandidates(moveId: string, scene: SceneState): SceneMon[] {
  const side = pickSide(incursionMove(moveId))
  if (side === PickSide.Foes) return scene.foes.filter(up)
  if (side === PickSide.Allies) return scene.party.filter(up)
  return []
}

/** El ataque que usa tu Pokémon este turno (y a quién) y, si lo has cambiado, el que usará desde el próximo */
export function pickNow(pilot: FightPilot, scene: SceneState): { applied: Pick; next: Pick } | null {
  const mine = scene.party.find((m) => m.id === pilot.uid)
  if (!mine?.moveId) return null
  const last = pilot.orders.flatMap((o) => o.turns ?? []).findLast((t) => t.picks?.[pilot.uid])?.picks[pilot.uid]
  const applied = { moveId: mine.moveId, target: last?.target ?? null }
  return { applied, next: pilot.pendingPick ?? applied }
}

/** Apuntar tocando la escena: a quién puede ir el ataque elegido, cuál está elegido y qué pasa al tocar a uno */
export interface SceneTargeting {
  ids: string[]
  chosen: string | null
  /** Tocar al elegido lo deja otra vez en «Auto» */
  pick: (id: string) => void
}

export function sceneTargeting(pilot: FightPilot, scene: SceneState): SceneTargeting | null {
  const now = pickNow(pilot, scene)
  if (!now) return null
  const { moveId, target } = now.next
  const ids = pickCandidates(moveId, scene).map((c) => c.id)
  if (ids.length === 0) return null
  const chosen = target && ids.includes(target) ? target : null
  return { ids, chosen, pick: (id) => pilot.choose({ moveId, target: id === chosen ? null : id }) }
}

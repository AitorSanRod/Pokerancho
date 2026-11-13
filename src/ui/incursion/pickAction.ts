import { incursionMove } from '../../data/incursionMoves'
import { act } from '../../game/core/store'
import type { ActiveIncursion } from '../../game/incursion/activeIncursion'
import { setIncursionPick } from '../../game/incursion/incursionPicks'
import { PickSide, pickSide } from '../../game/incursion/movePicks'
import { sendIncursionPick } from '../../net/incursionSync'
import type { SceneMon, SceneState } from './sceneState'

export interface Pick {
  moveId: string
  target: string | null
}

const up = (m: SceneMon) => m.hp > 0 && !m.out

/** A quién puede ir un ataque ahora mismo: rivales o aliados en pie, o nadie si no se dirige */
export function pickCandidates(moveId: string, scene: SceneState): SceneMon[] {
  const side = pickSide(incursionMove(moveId))
  if (side === PickSide.Foes) return scene.foes.filter(up)
  if (side === PickSide.Allies) return scene.party.filter(up)
  return []
}

/** El ataque que usa tu Pokémon este turno (y a quién) y, si lo has cambiado, el que usará desde el próximo */
export function pickNow(a: ActiveIncursion, scene: SceneState): { applied: Pick; next: Pick } | null {
  const mine = scene.party.find((m) => m.id === a.uid)
  if (!mine?.moveId) return null
  const last = a.orders.flatMap((o) => o.turns ?? []).findLast((t) => t.picks?.[a.uid])?.picks[a.uid]
  const applied = { moveId: mine.moveId, target: last?.target ?? null }
  return { applied, next: a.pendingPick ?? applied }
}

/** Apuntar tocando la escena: a quién puede ir el ataque elegido, cuál está elegido y qué pasa al tocar a uno */
export interface SceneTargeting {
  ids: string[]
  chosen: string | null
  /** Tocar al elegido lo deja otra vez en «Auto» */
  pick: (id: string) => void
}

export function sceneTargeting(a: ActiveIncursion, scene: SceneState): SceneTargeting | null {
  const now = pickNow(a, scene)
  if (!now) return null
  const { moveId, target } = now.next
  const ids = pickCandidates(moveId, scene).map((c) => c.id)
  if (ids.length === 0) return null
  const chosen = target && ids.includes(target) ? target : null
  return { ids, chosen, pick: (id) => choosePick(a, { moveId, target: id === chosen ? null : id }) }
}

/** Elegir ataque y objetivo: vale desde el próximo turno (sin servidor, en la partida; con él, también se le avisa) */
export function choosePick(a: ActiveIncursion, pick: Pick): void {
  act((s) => setIncursionPick(s, pick, Date.now()))
  if (a.online) void sendIncursionPick(pick.moveId, pick.target)
}

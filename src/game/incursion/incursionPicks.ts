import { findMon, type GameState } from '../core/state'
import { incursionProgress, IncursionPhase, type ActiveIncursion } from './activeIncursion'
import { monKnows } from './repertoire'
import type { MovePick, TurnOrders } from './tapWindow'

// Elegir en plena pelea el ataque de tu Pokémon y a quién lo dirige: se puede cambiar cuantas veces se quiera y vale
// desde la siguiente ventana de toques (ver movePicks.ts). Hasta entonces queda pendiente en la partida.

/** Elige ataque y objetivo para tu Pokémon desde el próximo turno; false si no puede (no lo conoce o ya acabó) */
export function setIncursionPick(s: GameState, pick: MovePick, now: number): boolean {
  const a = s.incursion
  const mon = a && findMon(s, a.uid)
  if (!a || !mon || incursionProgress(a, now).phase === IncursionPhase.Finished) return false
  if (!monKnows(mon, pick.moveId)) return false
  a.pendingPick = { moveId: pick.moveId, target: pick.target }
  return true
}

/** Lo que el jugador lleva decidido para la próxima ventana, como órdenes del turno */
export const pendingOrders = (a: ActiveIncursion, boosted: boolean): TurnOrders => ({
  boosted: boosted ? [a.uid] : [],
  picks: a.pendingPick ? { [a.uid]: a.pendingPick } : {},
})

import { rankingWeek } from '../core/ranking'
import type { GameState } from '../core/state'

// Récord de la torre de cada semana (`towerWeek`): el piso más alto superado, para su ranking semanal

/** Apunta el piso superado en el récord de la semana (empieza de cero si la semana es otra) */
export function recordWeekFloor(s: GameState, floor: number) {
  const week = rankingWeek(s.lastTick)
  s.towerWeek = { week, best: Math.max(towerWeekBest(s, s.lastTick), floor) }
}

/** Piso más alto superado en la semana de `now`: el de su ranking */
export const towerWeekBest = (s: GameState, now: number): number => (s.towerWeek.week === rankingWeek(now) ? s.towerWeek.best : 0)

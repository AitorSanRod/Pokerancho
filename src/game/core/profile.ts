import { BADGE_IDS } from '../../data/badges'
import { KANTO } from '../../data/maps'
import { towerWeekBest } from '../tower/towerWeek'
import type { GameState } from './state'

// Resumen de la partida para el perfil del menú del rancho: colección, progreso y récords (la Pokédex de cada región
// la cuenta la pantalla, como la de la Pokédex).

export interface ProfileStats {
  money: number
  tickets: number
  shards: number
  /** Pokémon que tiene (rancho y Caja) y cuántos son shiny */
  owned: number
  shiny: number
  /** Especies vistas y capturadas (la Pokédex de cada región, en la pantalla del perfil) */
  seen: number
  caught: number
  routes: { completed: number; total: number }
  badges: { earned: number; total: number }
  tower: { best: number; week: number }
}

export function profileStats(s: GameState, now: number): ProfileStats {
  return {
    money: s.money,
    tickets: s.tickets,
    shards: s.missingnoShards,
    owned: s.owned.length,
    shiny: s.owned.filter((m) => m.shiny).length,
    seen: s.seen.length,
    caught: s.caught.length,
    routes: { completed: KANTO.routes.filter((r) => s.completedRoutes.includes(r.id)).length, total: KANTO.routes.length },
    badges: { earned: BADGE_IDS.filter((b) => s.badges.includes(b)).length, total: BADGE_IDS.length },
    tower: { best: s.towerBest, week: towerWeekBest(s, now) },
  }
}

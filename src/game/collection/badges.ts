import type { Badge } from '../../data/badges'
import type { GameState } from '../core/state'

// Medallas de gimnasio de la partida (data/badges.ts): las da la primera victoria contra cada líder (run/runGym.ts).

export const hasBadge = (s: GameState, badge: Badge): boolean => s.badges.includes(badge)

/** Apunta la medalla; devuelve si es nueva */
export function earnBadge(s: GameState, badge: Badge): boolean {
  if (hasBadge(s, badge)) return false
  s.badges.push(badge)
  return true
}

import { isFavorite } from '../collection/dex'
import type { GameState, OwnedMon } from '../core/state'

/** Orden para elegir Pokémon (raids, expediciones, incursiones, intercambios): primero los favoritos y, en cada grupo, los de más nivel */
export function byPickOrder(s: GameState, mons: readonly OwnedMon[]): OwnedMon[] {
  const rank = (m: OwnedMon) => (isFavorite(s, m.speciesId) ? 0 : 1)
  return [...mons].sort((a, b) => rank(a) - rank(b) || b.level - a.level)
}

import { incursion, type IncursionId } from '../../data/incursions'
import type { GameState } from '../core/state'
import { noEarnings, type Earned } from './incursionRewards'

// Incursiones gratuitas (`free` en su ficha): se entra sin llave, pero lo ganado solo se cobra la primera vez que se
// termina (ganando, perdiendo o retirándose); las siguientes son solo para practicar.

/** true si ya no da nada: es gratuita y su premio ya se cobró */
export const freePrizeSpent = (s: GameState, id: IncursionId): boolean => !!incursion(id).free && s.freeIncursionsPlayed.includes(id)

/** Lo que se cobra al terminarla: todo lo ganado o, si ya no da nada, nada */
export const payableEarnings = (s: GameState, id: IncursionId, earned: Earned): Earned => (freePrizeSpent(s, id) ? noEarnings() : earned)

/** Al cobrarla: si es gratuita, apunta que ya no dará más */
export function markFreePlayed(s: GameState, id: IncursionId) {
  if (incursion(id).free && !s.freeIncursionsPlayed.includes(id)) s.freeIncursionsPlayed.push(id)
}

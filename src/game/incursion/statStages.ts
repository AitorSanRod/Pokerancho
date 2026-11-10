import type { BoostStat } from '../../data/incursionMoves'

// Subidas y bajadas de stats por etapas, como en los juegos: cada stat va de −MAX_STAGES a +MAX_STAGES y duran hasta
// acabar la sala (restRooms.ts › leaveRoom) o hasta caer.

/** Etapas que puede subir o bajar como mucho una stat */
export const MAX_STAGES = 6

export type Stages = Record<BoostStat, number>

export const noStages = (): Stages => ({ atk: 0, def: 0, spe: 0 })

/** Multiplicador de la stat con esas etapas: +1 ×1,5 … +6 ×4 (+300%); −1 ×2/3 … −6 ×1/4 */
export const stageMult = (stages: number): number => (stages >= 0 ? (2 + stages) / 2 : 2 / (2 - stages))

/** Suma etapas sin pasar del máximo ni del mínimo; devuelve las que se aplicaron de verdad (0: ya estaba al tope) */
export function addStages(stages: Stages, k: BoostStat, n: number): number {
  const next = Math.max(-MAX_STAGES, Math.min(MAX_STAGES, stages[k] + n))
  const applied = next - stages[k]
  stages[k] = next
  return applied
}

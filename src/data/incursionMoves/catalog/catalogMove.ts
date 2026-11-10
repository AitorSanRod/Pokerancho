import type { PokeType } from '../../types'
import { move, type IncursionMove, type MoveEffect } from '../effects'

// Cómo se escribe un ataque del catálogo: con la precisión que tiene en los juegos; aquí se le suma la mejora.

/** Puntos de precisión (%) que se suman a la de los juegos en los ataques del catálogo */
export const CATALOG_ACCURACY_BONUS = 10
/** Puntos que se suman, en lugar de CATALOG_ACCURACY_BONUS, a los que en los juegos tienen justo 90 */
export const CATALOG_ACCURACY_BONUS_AT_90 = 5
/** Potencia de cura de los que curan a uno (como Amortiguador o Luz Lunar) */
export const SINGLE_HEAL_POWER = 70
/** Potencia de cura de los que curan a todo el grupo (como Acua Aro) */
export const TEAM_HEAL_POWER = 30
/** Daño que deja de recibir el que atrae los golpes (0.4 = −40%), como Vasta Guardia */
export const REDIRECT_GUARD = 0.4

/** La precisión de los juegos con la mejora del catálogo, sin pasar de 100 */
export const boostedAccuracy = (accuracy: number): number =>
  Math.min(100, accuracy + (accuracy === 90 ? CATALOG_ACCURACY_BONUS_AT_90 : CATALOG_ACCURACY_BONUS))

interface CatalogOptions {
  /** La de los juegos (100 si no falla nunca) */
  accuracy?: number
  priority?: number
}

export const catalogMove = (id: string, name: string, type: PokeType, power: number, effects: MoveEffect[] = [], opts: CatalogOptions = {}): IncursionMove =>
  move(id, name, type, power, effects, { ...opts, accuracy: boostedAccuracy(opts.accuracy ?? 100) })

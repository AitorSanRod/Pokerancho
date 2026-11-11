import { DEFAULT_RANCH_BACKDROP, isRanchBackdrop, type RanchBackdrop } from '../../data/ranchBackdrops'
import type { GameState } from '../core/state'
import { ranchCount } from './ranches'

/** Fondo que se ve en el rancho: el que ha elegido el jugador o el de por defecto */
export const ranchBackdrop = (s: GameState, ranch: number): RanchBackdrop => s.ranchBackdropOf[ranch] ?? DEFAULT_RANCH_BACKDROP

/** Cambia el fondo del rancho; el de por defecto no se guarda */
export function setRanchBackdrop(s: GameState, ranch: number, backdrop: RanchBackdrop): boolean {
  if (!Number.isInteger(ranch) || ranch < 0 || ranch >= ranchCount(s) || !isRanchBackdrop(backdrop)) return false
  if (backdrop === DEFAULT_RANCH_BACKDROP) delete s.ranchBackdropOf[ranch]
  else s.ranchBackdropOf[ranch] = backdrop
  return true
}

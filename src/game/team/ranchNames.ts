import type { GameState } from '../core/state'
import { ranchCount } from './ranches'

/** Letras que puede tener como mucho el nombre de un rancho */
export const RANCH_NAME_MAX_LENGTH = 20

/** El nombre tal como se guarda: sin espacios de sobra y recortado al máximo */
export const cleanRanchName = (name: string): string => name.trim().replace(/\s+/g, ' ').slice(0, RANCH_NAME_MAX_LENGTH).trim()

/** Nombre por defecto de un rancho, por su índice */
export const defaultRanchName = (ranch: number): string => `Rancho ${ranch + 1}`

/** Nombre que se ve del rancho: el que le ha puesto el jugador o «Rancho N» */
export const ranchName = (s: GameState, ranch: number): string => s.ranchNames[ranch] ?? defaultRanchName(ranch)

/** Cambia el nombre del rancho; un nombre vacío (o el de por defecto) le devuelve el suyo */
export function renameRanch(s: GameState, ranch: number, name: string): boolean {
  if (!Number.isInteger(ranch) || ranch < 0 || ranch >= ranchCount(s)) return false
  const clean = cleanRanchName(name)
  if (!clean || clean === defaultRanchName(ranch)) delete s.ranchNames[ranch]
  else s.ranchNames[ranch] = clean
  return true
}

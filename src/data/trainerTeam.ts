import type { Boss } from './maps/mapCommon'

// El equipo de quien saca sus Pokémon uno tras otro: un entrenador de ruta (trainers.ts) o un líder de gimnasio
// (gyms.ts).

/** Un Pokémon del equipo: especie y nivel, y a mano sus pasivas de tipo, su multiplicador de stats y sus ataques */
export interface TrainerFoe extends Boss {
  /** Multiplicador de sus stats (1 = las de su nivel, 1.2 = +20 %); sin él, 1 */
  statMult?: number
  /**
   * Ataques de incursión que usa (`IMOVE.X.id`), de daño: en cada turno, el que más daño espera hacer al rival (tipo,
   * potencia y precisión). Sin ellos, el suyo de siempre
   */
  moves?: string[]
}

/** El equipo, en el orden en que los saca */
export type TrainerTeam = TrainerFoe[]

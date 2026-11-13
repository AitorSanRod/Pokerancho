import { baseStatTotal, SPECIES } from '../../data/species'
import { TOWER_CUTS } from '../../data/towerCuts'
import { rollPiece } from '../collection/gacha'
import type { Rng } from '../core/random'
import type { GameState } from '../core/state'
import { MAX_LEVEL } from '../team/stats'

// Rivales de la torre infinita: un nivel más por piso hasta el nivel máximo, solo especies que el jugador ya ha visto.
// Pasado ese piso salen especies al azar por rareza (como en el gacha), sin apuntarse en la Pokédex, y sus stats van
// subiendo poco a poco para que siga costando. Desde ciertos pisos, los cortes de poder de data/towerCuts.ts dejan
// fuera a las especies más débiles.

/** Niveles que sube el rival en cada piso (el piso 1 es nivel TOWER_LEVELS_PER_FLOOR) */
export const TOWER_LEVELS_PER_FLOOR = 1
/** Multiplicador de las stats de los rivales hasta el último piso de nivel */
export const TOWER_STAT_MULT = 0.8
/** Lo que suben las stats del rival por cada piso pasado el último de nivel: 0.02 es +2 % del de partida por piso */
export const TOWER_STAT_GROWTH = 0.02

/** Último piso en el que el rival sube de nivel; a partir del siguiente, rivales de cualquier especie y stats al alza */
export const TOWER_LEVEL_CAP_FLOOR = MAX_LEVEL / TOWER_LEVELS_PER_FLOOR

/** Pisos por encima del último de nivel (0 hasta llegar a él) */
export const floorsPastCap = (floor: number): number => Math.max(0, floor - TOWER_LEVEL_CAP_FLOOR)

/** El piso es de los de después del nivel máximo */
export const pastLevelCap = (floor: number): boolean => floorsPastCap(floor) > 0

export const towerLevel = (floor: number): number => Math.min(MAX_LEVEL, floor * TOWER_LEVELS_PER_FLOOR)

/** Multiplicador de las stats del rival de ese piso */
export const towerStatMult = (floor: number): number => TOWER_STAT_MULT * (1 + floorsPastCap(floor) * TOWER_STAT_GROWTH)

/** Total mínimo de stats base del rival en ese piso (el del último corte alcanzado de data/towerCuts.ts; 0 sin corte) */
export function towerMinPower(floor: number): number {
  return TOWER_CUTS.filter((c) => c.fromFloor <= floor).reduce((min, c) => Math.max(min, c.minPower), 0)
}

/**
 * Especie del rival, siempre con el poder del corte del piso: una vista al azar (si no ha visto ninguna que llegue,
 * una cualquiera que llegue) o, pasado el último piso de nivel, una cualquiera por rareza
 */
export function towerFoe(s: GameState, floor: number, rng: Rng): number {
  const minPower = towerMinPower(floor)
  const strong = (sp: (typeof SPECIES)[number]) => baseStatTotal(sp) >= minPower
  if (pastLevelCap(floor)) return rollPiece(rng, strong).speciesId
  const allowed = new Set(SPECIES.filter(strong).map((sp) => sp.id))
  const seen = s.seen.filter((id) => allowed.has(id))
  const pool = seen.length > 0 ? seen : [...allowed]
  return pool[Math.floor(rng() * pool.length)]
}

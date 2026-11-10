import { CATALOG_MOVES } from './catalog'
import { DAMAGE_MOVES } from './damage'
import type { IncursionMove } from './effects'
import { SUPPORT_MOVES } from './support'

export * from './effects'
export { DAMAGE_BY_TYPE, DAMAGE_MOVES } from './damage'
export { SUPPORT_BY_TYPE, SUPPORT_MOVES } from './support'
export { CATALOG_BY_TYPE } from './catalog'

/**
 * Todos los ataques de incursión por su nombre en el código (p. ej. `IMOVE.Rayo`; en español, como se ven en el juego,
 * sin tildes ni ñ): así no se escriben ids sueltos. Los de los tipos y rarezas (damage, support) y el catálogo
 */
export const IMOVE = { ...DAMAGE_MOVES, ...SUPPORT_MOVES, ...CATALOG_MOVES }

const BY_ID = new Map<string, IncursionMove>(Object.values(IMOVE).map((mv) => [mv.id, mv]))

export function incursionMove(id: string): IncursionMove {
  const mv = BY_ID.get(id)
  if (!mv) throw new Error(`Movimiento desconocido: ${id}`)
  return mv
}

export const isIncursionMove = (id: string): boolean => BY_ID.has(id)

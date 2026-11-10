import { DAMAGE_MOVES } from './damage'
import type { IncursionMove } from './effects'
import { SUPPORT_MOVES } from './support'

export * from './effects'
export { DAMAGE_BY_TYPE } from './damage'
export { SUPPORT_BY_TYPE } from './support'

/** Todos los ataques de incursión por su nombre en el código (p. ej. `IMOVE.Surf`): así no se escriben ids sueltos */
export const IMOVE = { ...DAMAGE_MOVES, ...SUPPORT_MOVES }

const BY_ID = new Map<string, IncursionMove>(Object.values(IMOVE).map((mv) => [mv.id, mv]))

export function incursionMove(id: string): IncursionMove {
  const mv = BY_ID.get(id)
  if (!mv) throw new Error(`Movimiento desconocido: ${id}`)
  return mv
}

export const isIncursionMove = (id: string): boolean => BY_ID.has(id)

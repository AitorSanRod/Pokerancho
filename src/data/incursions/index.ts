import { CUEVA_HELADA } from './cuevaHelada'
import { PRUEBA } from './prueba'
import { BOSQUE_VERDE } from './bosqueVerde'
import type { Incursion, IncursionId } from './types'

export * from './types'

/** Las incursiones en el orden en que se enseñan */
export const INCURSIONS: Incursion[] = [PRUEBA, BOSQUE_VERDE, CUEVA_HELADA]

export function incursion(id: IncursionId): Incursion {
  const found = INCURSIONS.find((i) => i.id === id)
  if (!found) throw new Error(`Incursión desconocida: ${id}`)
  return found
}

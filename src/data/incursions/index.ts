import { CUEVA_HELADA } from './cuevaHelada'
import { PRUEBA } from './prueba'
import { BOSQUE_VERDE } from './bosqueVerde'
import { CENTRAL_ENERGIA } from './centralEnergia'
import { TORRE_POKEMON } from './torrePokemon'
import { DOJO_KARATE } from './dojoKarate'
import { VOLCAN_CANELA } from './volcanCanela'
import { CALLE_VICTORIA } from './calleVictoria'
import { GUARIDA_DRAGON } from './guaridaDragon'
import type { Incursion, IncursionId } from './types'

export * from './types'

/** Las incursiones en el orden en que se enseñan */
export const INCURSIONS: Incursion[] = [
  PRUEBA,
  BOSQUE_VERDE,
  CUEVA_HELADA,
  CENTRAL_ENERGIA,
  TORRE_POKEMON,
  DOJO_KARATE,
  VOLCAN_CANELA,
  CALLE_VICTORIA,
  GUARIDA_DRAGON,
]

export function incursion(id: IncursionId): Incursion {
  const found = INCURSIONS.find((i) => i.id === id)
  if (!found) throw new Error(`Incursión desconocida: ${id}`)
  return found
}

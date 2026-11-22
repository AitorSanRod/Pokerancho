import type { IncursionMove } from '../../../data/incursionMoves'
import { learnedFrom, MoveSection, SECTION_SLOTS } from '../../../game/combat/moveLoadout'
import { classMeta, strikeMeta } from '../moveText'

// Cómo se ve cada sección de ataques de la ficha (la «i»): título, explicación y la línea de cada botón

interface SectionLook {
  title: string
  hint: string
  /** Línea de debajo del nombre en cada botón */
  meta: (mv: IncursionMove) => string
  /** Si en sus datos cuentan los toques (solo en las incursiones) */
  taps: boolean
}

export const SECTION_LOOK: Record<MoveSection, SectionLook> = {
  [MoveSection.Route]: {
    title: 'Rutas, torre y raids',
    hint: `Lleva ${SECTION_SLOTS[MoveSection.Route]} ataques de daño. Antes de salir eliges con cuál va, y puedes cambiarlo en pleno combate.`,
    meta: strikeMeta,
    taps: false,
  },
  [MoveSection.Incursion]: {
    title: 'Incursiones',
    hint: `Lleva ${SECTION_SLOTS[MoveSection.Incursion]} ataques: de daño, de cura o de estado, de incursión o de ruta. Antes de entrar eliges con cuál empieza, y en plena pelea cambias entre ellos.`,
    meta: classMeta,
    taps: true,
  },
}

/** «Desde Nv. 12» o «Con MT» */
export function originText(speciesId: number, section: MoveSection, moveId: string): string {
  const from = learnedFrom(speciesId, section, moveId)
  return from === null ? 'Con MT' : `Desde Nv. ${from}`
}

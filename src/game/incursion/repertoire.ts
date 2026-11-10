import { DAMAGE_BY_TYPE, incursionMove, SUPPORT_BY_TYPE, type IncursionMove } from '../../data/incursionMoves'
import { DAMAGE_TIER_LEVELS, SPECIES_MOVES } from '../../data/learnsets'
import { Rarity, rarityOf, species } from '../../data/species'
import type { PokeType } from '../../data/types'
import { MAX_LEVEL } from '../team/stats'

// Los movimientos que puede llevar un Pokémon a una incursión: como mucho dos por cada uno de sus tipos (su mejor ataque
// de daño y el de apoyo del tipo, desde su nivel), más los propios de su especie. (Más adelante, también las MTs.)

const RARITY_ORDER = Object.values(Rarity)

/** El ataque de daño de un tipo en el escalón más alto al que llega: sin pasar de su rareza y con el nivel justo */
function bestDamageMove(type: PokeType, rarity: Rarity, level: number): IncursionMove {
  const reached = RARITY_ORDER.slice(0, RARITY_ORDER.indexOf(rarity) + 1).filter((r) => level >= DAMAGE_TIER_LEVELS[r])
  return DAMAGE_BY_TYPE[type][reached.at(-1) ?? Rarity.Common]
}

export function repertoire(speciesId: number, level: number): IncursionMove[] {
  const sp = species(speciesId)
  const byType = sp.types.flatMap((t) => {
    const support = SUPPORT_BY_TYPE[t]
    return [bestDamageMove(t, rarityOf(sp), level), ...(level >= support.level ? [support.move] : [])]
  })
  const own = (SPECIES_MOVES[speciesId] ?? []).filter((m) => level >= m.level).map((m) => incursionMove(m.moveId))
  const all = [...byType, ...own]
  return all.filter((mv, i) => all.findIndex((other) => other.id === mv.id) === i)
}

export const canLearn = (speciesId: number, level: number, moveId: string): boolean =>
  repertoire(speciesId, level).some((mv) => mv.id === moveId)

/** Un movimiento del repertorio de una especie: desde qué nivel lo lleva y hasta cuál (null: ya no lo pierde) */
export interface LearnStep {
  move: IncursionMove
  from: number
  until: number | null
}

/** Todo lo que lleva una especie a lo largo de sus niveles, por orden de aprendizaje */
export function learnTimeline(speciesId: number): LearnStep[] {
  const steps = new Map<string, LearnStep>()
  for (let level = 1; level <= MAX_LEVEL; level++) {
    const now = repertoire(speciesId, level)
    for (const mv of now) if (!steps.has(mv.id)) steps.set(mv.id, { move: mv, from: level, until: null })
    for (const step of steps.values()) if (step.until === null && !now.some((mv) => mv.id === step.move.id)) step.until = level - 1
  }
  return [...steps.values()]
}

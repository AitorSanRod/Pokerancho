import { battleMove, DAMAGE_TIER_LEVELS, SPECIES_MOVES, type BattleMove } from '../../data/learnsets'
import { typeMove } from '../../data/moves'
import { Rarity, rarityOf, species } from '../../data/species'
import { MoveKind, SUPPORT_MOVES } from '../../data/supportMoves'
import type { PokeType } from '../../data/types'

// Los movimientos que puede llevar un Pokémon a una incursión: como mucho dos por cada uno de sus tipos (su mejor ataque
// de daño y el de apoyo del tipo, desde su nivel), más los propios de su especie. (Más adelante, también las MTs.)

const RARITY_ORDER = Object.values(Rarity)

/** El ataque de daño de un tipo en el escalón más alto al que llega: sin pasar de su rareza y con el nivel justo */
function bestDamageMove(type: PokeType, rarity: Rarity, level: number): BattleMove {
  const reached = RARITY_ORDER.slice(0, RARITY_ORDER.indexOf(rarity) + 1).filter((r) => level >= DAMAGE_TIER_LEVELS[r])
  return { ...typeMove(type, reached.at(-1) ?? Rarity.Common), kind: MoveKind.Damage }
}

export function repertoire(speciesId: number, level: number): BattleMove[] {
  const sp = species(speciesId)
  const byType = sp.types.flatMap((t) => {
    const support = SUPPORT_MOVES[t]
    return [bestDamageMove(t, rarityOf(sp), level), ...(level >= support.level ? [support] : [])]
  })
  const own = (SPECIES_MOVES[speciesId] ?? []).filter((m) => level >= m.level).map((m) => battleMove(m.moveId))
  const all = [...byType, ...own]
  return all.filter((mv, i) => all.findIndex((other) => other.id === mv.id) === i)
}

export const canLearn = (speciesId: number, level: number, moveId: string): boolean =>
  repertoire(speciesId, level).some((mv) => mv.id === moveId)

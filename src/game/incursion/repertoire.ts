import { battleMove, DAMAGE_TIER_LEVELS, SPECIES_MOVES, type BattleMove } from '../../data/learnsets'
import { typeMove } from '../../data/moves'
import { Rarity, rarityOf, species } from '../../data/species'
import { MoveKind, SUPPORT_MOVES } from '../../data/supportMoves'

// Los movimientos que puede llevar un Pokémon a una incursión: los de daño de sus tipos hasta el escalón de su rareza,
// los de apoyo de sus tipos y los propios de su especie, cada uno desde su nivel. (Más adelante, también las MTs.)

const RARITY_ORDER = Object.values(Rarity)

function damageMoves(speciesId: number, level: number): BattleMove[] {
  const sp = species(speciesId)
  const tiers = RARITY_ORDER.slice(0, RARITY_ORDER.indexOf(rarityOf(sp)) + 1).filter((r) => level >= DAMAGE_TIER_LEVELS[r])
  return sp.types.flatMap((t) => tiers.map((r) => ({ ...typeMove(t, r), kind: MoveKind.Damage })))
}

export function repertoire(speciesId: number, level: number): BattleMove[] {
  const support = species(speciesId).types.flatMap((t) => SUPPORT_MOVES[t].filter((mv) => level >= mv.level))
  const own = (SPECIES_MOVES[speciesId] ?? []).filter((m) => level >= m.level).map((m) => battleMove(m.moveId))
  const all = [...damageMoves(speciesId, level), ...support, ...own]
  return all.filter((mv, i) => all.findIndex((other) => other.id === mv.id) === i)
}

export const canLearn = (speciesId: number, level: number, moveId: string): boolean =>
  repertoire(speciesId, level).some((mv) => mv.id === moveId)

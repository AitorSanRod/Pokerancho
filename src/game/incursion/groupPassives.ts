import { GROUP_PASSIVE_THRESHOLDS, GROUP_PASSIVES, RARITY_WEIGHT, type GroupPassiveLevel } from '../../data/incursionPassives'
import { rarityOf, species } from '../../data/species'
import type { PokeType } from '../../data/types'
import { sumEffects } from '../battle/combatBonus'
import type { GroupFighter } from './fighter'

// Pasivas de grupo: cada Pokémon que sigue en la incursión suma el peso de su rareza a cada uno de sus tipos. Las
// pasivas que salen valen para todo el grupo; un caído sin revivir deja de sumar.

export interface GroupPassive {
  type: PokeType
  level: GroupPassiveLevel
}

/** Peso de cada tipo en el grupo, sin contar a los que ya no vuelven */
export function typeWeights(party: GroupFighter[]): Partial<Record<PokeType, number>> {
  const weights: Partial<Record<PokeType, number>> = {}
  for (const f of party.filter((p) => !p.out)) {
    const weight = RARITY_WEIGHT[rarityOf(species(f.speciesId))]
    for (const t of f.types) weights[t] = (weights[t] ?? 0) + weight
  }
  return weights
}

export function groupPassives(party: GroupFighter[]): GroupPassive[] {
  return Object.entries(typeWeights(party)).flatMap(([type, weight]) => {
    const level = GROUP_PASSIVE_THRESHOLDS.filter((t) => weight >= t).length
    return level > 0 ? [{ type: type as PokeType, level: level as GroupPassiveLevel }] : []
  })
}

/** Pone a todo el grupo sus pasivas; si cambian los PS máximos, los actuales se mueven en la misma proporción */
export function applyGroupPassives(party: GroupFighter[], passives: GroupPassive[]) {
  const bonus = sumEffects(passives.map((p) => GROUP_PASSIVES[p.type][p.level - 1]))
  for (const f of party) {
    const maxHp = Math.round(f.base.hp * (1 + bonus.hp))
    f.hp = f.maxHp ? Math.round((f.hp * maxHp) / f.maxHp) : 0
    f.maxHp = maxHp
    f.bonus = structuredClone(bonus)
  }
}

export const samePassives = (a: GroupPassive[], b: GroupPassive[]): boolean =>
  a.length === b.length && a.every((p) => b.some((q) => q.type === p.type && q.level === p.level))

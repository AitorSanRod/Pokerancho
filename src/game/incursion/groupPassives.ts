import type { PassiveRef } from '../../data/passives'
import { combineBonus } from '../battle/combatBonus'
import { passivesFrom, typeWeights } from '../team/ranchPassives'
import type { GroupFighter } from './fighter'

// Pasivas de grupo: las mismas de tipo que en el rancho (data/passives.ts), pero con el peso de los Pokémon que siguen
// en la incursión en lugar de los del rancho. Las que salen valen para todo el grupo; un caído sin revivir deja de sumar.

export type GroupPassive = PassiveRef

/** Peso de cada tipo en el grupo, sin contar a los que ya no vuelven */
export const groupTypeWeights = (party: GroupFighter[]) => typeWeights(party.filter((p) => !p.out).map((p) => p.speciesId))

export const groupPassives = (party: GroupFighter[]): GroupPassive[] => passivesFrom(groupTypeWeights(party))

/** Pone a todo el grupo sus pasivas; si cambian los PS máximos, los actuales se mueven en la misma proporción */
export function applyGroupPassives(party: GroupFighter[], passives: GroupPassive[]) {
  const bonus = combineBonus(passives)
  for (const f of party) {
    const maxHp = Math.round(f.base.hp * (1 + bonus.hp))
    f.hp = f.maxHp ? Math.round((f.hp * maxHp) / f.maxHp) : 0
    f.maxHp = maxHp
    f.bonus = structuredClone(bonus)
  }
}

export const samePassives = (a: GroupPassive[], b: GroupPassive[]): boolean =>
  a.length === b.length && a.every((p) => b.some((q) => q.type === p.type && q.level === p.level))

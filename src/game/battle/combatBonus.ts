import { TYPE_PASSIVES, type PassiveEffect, type PassiveRef, type StatusId } from '../../data/passives'

/** Todas las pasivas de un combatiente sumadas: los porcentajes se suman y los estados se acumulan */
export interface CombatBonus {
  hp: number
  atk: number
  def: number
  spe: number
  inflicts: { status: StatusId; chance: number }[]
  drain: number
  damageReduction: number
  dodge: number
  crit: number
  koHeal: number
  /** Lo más que le quita un ataque, en fracción de sus PS máximos (1 = sin tope; con varias, la más baja) */
  maxHitTaken: number
  speedPerAttack: number
}

/** Tope de reducción de daño, esquiva y crítico, para que ningún combate quede decidido de antemano */
const MAX_CHANCE = 0.9

const NO_BONUS: CombatBonus = {
  hp: 0,
  atk: 0,
  def: 0,
  spe: 0,
  inflicts: [],
  drain: 0,
  damageReduction: 0,
  dodge: 0,
  crit: 0,
  koHeal: 0,
  maxHitTaken: 1,
  speedPerAttack: 0,
}

/** Suma de las pasivas de tipo; la reducción de daño, la esquiva y el crítico no pasan del 90% */
export const combineBonus = (passives: PassiveRef[]): CombatBonus =>
  sumEffects(passives.map(({ type, level }) => TYPE_PASSIVES[type][level - 1]))

export function sumEffects(effects: PassiveEffect[]): CombatBonus {
  const total = structuredClone(NO_BONUS)
  for (const e of effects) {
    total.hp += e.hp ?? 0
    total.atk += e.atk ?? 0
    total.def += e.def ?? 0
    total.spe += e.spe ?? 0
    total.drain += e.drain ?? 0
    total.damageReduction += e.damageReduction ?? 0
    total.dodge += e.dodge ?? 0
    total.crit += e.crit ?? 0
    total.koHeal += e.koHeal ?? 0
    total.maxHitTaken = Math.min(total.maxHitTaken, e.maxHitTaken ?? 1)
    total.speedPerAttack += e.speedPerAttack ?? 0
    if (e.inflict) total.inflicts.push(e.inflict)
  }
  total.damageReduction = Math.min(MAX_CHANCE, total.damageReduction)
  total.dodge = Math.min(MAX_CHANCE, total.dodge)
  total.crit = Math.min(MAX_CHANCE, total.crit)
  return total
}

/** El daño de un ataque con el tope de la pasiva de quien lo recibe (nunca menos de 1) */
export const cappedHit = (dealt: number, bonus: CombatBonus, maxHp: number): number =>
  bonus.maxHitTaken < 1 ? Math.min(dealt, Math.max(1, Math.ceil(maxHp * bonus.maxHitTaken))) : dealt

/** PS que recupera al derrotar a un rival con un ataque */
export const koHealAmount = (bonus: CombatBonus, maxHp: number): number => maxHp * bonus.koHeal

import type { PassiveEffect } from './passives'
import { Rarity } from './species'
import type { PokeType } from './types'

// Pasivas de grupo de las incursiones: cada Pokémon del grupo que sigue en la incursión suma a cada uno de sus tipos
// el peso de su rareza; con suficiente peso en un tipo, todo el grupo gana su pasiva. Para editar a mano.

/** Cuánto suma cada Pokémon a cada uno de sus tipos según su rareza (los de dos tipos suman en ambos) */
export const RARITY_WEIGHT: Record<Rarity, number> = {
  [Rarity.Common]: 1,
  [Rarity.Rare]: 2,
  [Rarity.Epic]: 3,
  [Rarity.Legendary]: 4,
}

/** Peso de un tipo en el grupo que hace falta para el nivel 1, 2 y 3 de su pasiva */
export const GROUP_PASSIVE_THRESHOLDS = [3, 6, 10] as const

export type GroupPassiveLevel = 1 | 2 | 3

/** Efecto de cada nivel; vale para los 5. Los campos son los de las pasivas de rancho (`winHeal` no se usa aquí) */
export const GROUP_PASSIVES: Record<PokeType, [PassiveEffect, PassiveEffect, PassiveEffect]> = {
  normal: [{ hp: 0.1 }, { hp: 0.2 }, { hp: 0.3 }],
  fire: [{ atk: 0.1 }, { atk: 0.2 }, { atk: 0.3 }],
  water: [{ regen: 0.02 }, { regen: 0.04 }, { regen: 0.06 }],
  grass: [{ drain: 0.08 }, { drain: 0.15 }, { drain: 0.25 }],
  electric: [{ spe: 0.15 }, { spe: 0.3 }, { spe: 0.45 }],
  ice: [{ def: 0.1 }, { def: 0.2 }, { def: 0.3 }],
  fighting: [{ atk: 0.08, crit: 0.05 }, { atk: 0.15, crit: 0.1 }, { atk: 0.25, crit: 0.15 }],
  poison: [{ bonusVs: { types: ['grass', 'fairy'], damage: 0.15 } }, { bonusVs: { types: ['grass', 'fairy'], damage: 0.3 } }, { bonusVs: { types: ['grass', 'fairy'], damage: 0.45 } }],
  ground: [{ def: 0.08, hp: 0.05 }, { def: 0.15, hp: 0.1 }, { def: 0.25, hp: 0.15 }],
  flying: [{ dodge: 0.05 }, { dodge: 0.1 }, { dodge: 0.15 }],
  psychic: [{ crit: 0.05, spe: 0.05 }, { crit: 0.1, spe: 0.1 }, { crit: 0.15, spe: 0.15 }],
  bug: [{ bonusVs: { types: ['grass', 'psychic', 'dark'], damage: 0.15 } }, { bonusVs: { types: ['grass', 'psychic', 'dark'], damage: 0.3 } }, { bonusVs: { types: ['grass', 'psychic', 'dark'], damage: 0.45 } }],
  rock: [{ damageReduction: 0.05 }, { damageReduction: 0.1 }, { damageReduction: 0.15 }],
  ghost: [{ dodge: 0.08 }, { dodge: 0.15 }, { dodge: 0.2 }],
  dragon: [{ hp: 0.05, atk: 0.05, def: 0.05, spe: 0.05 }, { hp: 0.1, atk: 0.1, def: 0.1, spe: 0.1 }, { hp: 0.15, atk: 0.15, def: 0.15, spe: 0.15 }],
  dark: [{ crit: 0.08 }, { crit: 0.15 }, { crit: 0.25 }],
  steel: [{ damageReduction: 0.06 }, { damageReduction: 0.12 }, { damageReduction: 0.18 }],
  fairy: [{ regen: 0.015, def: 0.05 }, { regen: 0.03, def: 0.1 }, { regen: 0.045, def: 0.15 }],
}

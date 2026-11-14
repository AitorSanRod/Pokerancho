import type { PokeType } from './types'

// Pasivas de tipo: con varios Pokémon del mismo tipo (cada uno vale según su rareza, `RARITY_INFO.passiveWeight`), se
// gana la pasiva de ese tipo. En rutas, jefes, gimnasios, raids y torre cuentan los del rancho del Pokémon
// (game/team/ranchPassives.ts); en las incursiones, los del grupo (game/incursion/groupPassives.ts). Este fichero es
// para editarlo a mano: umbrales, efectos de cada nivel y estados alterados.

/** Peso de un tipo que hace falta para el nivel 1, 2 y 3 de su pasiva */
export const PASSIVE_THRESHOLDS = [3, 4, 5] as const

/** Nivel de una pasiva: 1, 2 o 3 */
export type PassiveLevel = 1 | 2 | 3

export const StatusId = { Burn: 'burn', Poison: 'poison', Paralysis: 'paralysis', Freeze: 'freeze', Confusion: 'confusion', Sleep: 'sleep' } as const
export type StatusId = (typeof StatusId)[keyof typeof StatusId]

interface StatusInfo {
  name: string
  /** Abreviatura de tres letras para la insignia de la barra de vida */
  short: string
  /** Tipo cuyo color y efecto de golpe lo representan */
  type: PokeType
  /** Texto al recibirlo («se quemó») */
  verb: string
  /** Fracción de los PS máximos que pierde al final de cada turno */
  damagePerTurn?: number
  /** Multiplicador de su ataque mientras dura */
  atkMult?: number
  /** Probabilidad de no poder atacar en su turno */
  skipChance?: number
  /** Turnos que pierde seguidos; luego se le pasa */
  skipTurns?: number
  /** Probabilidad de golpearse a sí mismo en vez de atacar (con la mitad de su daño normal) */
  selfHitChance?: number
}

/** Estados alterados de pasivas y ataques; en las rutas duran todo el combate salvo la congelación (en incursiones, ver groupStatus.ts) */
export const STATUS_INFO: Record<StatusId, StatusInfo> = {
  [StatusId.Burn]: { name: 'Quemadura', short: 'QUE', type: 'fire', verb: 'se quemó', damagePerTurn: 0.06, atkMult: 0.75 },
  [StatusId.Poison]: { name: 'Veneno', short: 'ENV', type: 'poison', verb: 'fue envenenado', damagePerTurn: 0.08 },
  [StatusId.Paralysis]: { name: 'Parálisis', short: 'PAR', type: 'electric', verb: 'quedó paralizado', skipChance: 0.25 },
  [StatusId.Freeze]: { name: 'Congelación', short: 'CON', type: 'ice', verb: 'quedó congelado', skipTurns: 1 },
  [StatusId.Confusion]: { name: 'Confusión', short: 'CNF', type: 'psychic', verb: 'quedó confuso', selfHitChance: 0.33 },
  // Solo lo ponen ataques de incursión; cuándo se despierta, en game/incursion/groupStatus.ts › SLEEP_WAKE_CHANCES
  [StatusId.Sleep]: { name: 'Sueño', short: 'DOR', type: 'normal', verb: 'se durmió' },
}

/**
 * Lo que da una pasiva. Las stats son fracciones que se suman (0.2 = +20%); las probabilidades, de 0 a 1.
 * Se pueden combinar varios campos en un mismo nivel.
 */
export interface PassiveEffect {
  hp?: number
  atk?: number
  def?: number
  spe?: number
  /** Probabilidad, en cada golpe que acierta, de infligir un estado al rival */
  inflict?: { status: StatusId; chance: number }
  /** Fracción del daño hecho que recupera como PS */
  drain?: number
  /** Fracción del daño recibido que se evita (0.2 = recibe un 20% menos) */
  damageReduction?: number
  /** Probabilidad de esquivar un ataque que iba a acertar */
  dodge?: number
  /** Probabilidad de golpe crítico (×1.5 de daño) */
  crit?: number
  /** Fracción de los PS máximos que recupera cada vez que derrota a un rival con un ataque */
  koHeal?: number
  /** Fracción de los PS máximos que le puede quitar como mucho un ataque (0.9 = nunca más del 90 %) */
  maxHitTaken?: number
  /** Etapas de Velocidad que sube cada vez que ataca (acierte o no), hasta el tope de etapas */
  speedPerAttack?: number
}

const inflicts =
  (status: StatusId) =>
  (chance: number): PassiveEffect => ({ inflict: { status, chance } })
const burns = inflicts(StatusId.Burn)
const paralyzes = inflicts(StatusId.Paralysis)
const freezes = inflicts(StatusId.Freeze)
const poisons = inflicts(StatusId.Poison)
const confuses = inflicts(StatusId.Confusion)
const allStats = (v: number): PassiveEffect => ({ hp: v, atk: v, def: v, spe: v })

/** Pasiva de cada tipo: nivel 1, 2 y 3, tal y como cuentan en combate */
export const TYPE_PASSIVES: Record<PokeType, [PassiveEffect, PassiveEffect, PassiveEffect]> = {
  normal: [{ hp: 0.05 }, { hp: 0.1 }, { hp: 0.15 }],
  fire: [burns(0.1), burns(0.2), burns(0.25)],
  water: [{ def: 0.1 }, { def: 0.2 }, { def: 0.25 }],
  grass: [{ drain: 0.06 }, { drain: 0.15 }, { drain: 0.2 }],
  electric: [paralyzes(0.05), paralyzes(0.1), paralyzes(0.15)],
  ice: [freezes(0.05), freezes(0.1), freezes(0.15)],
  fighting: [{ atk: 0.1 }, { atk: 0.2 }, { atk: 0.25 }],
  poison: [poisons(0.1), poisons(0.2), poisons(0.25)],
  ground: [{ def: 0.1 }, { def: 0.2 }, { def: 0.25 }],
  flying: [{ spe: 0.1 }, { spe: 0.2 }, { spe: 0.3 }],
  psychic: [confuses(0.1), confuses(0.15), confuses(0.2)],
  // Bicho solo da algo en el nivel 3
  bug: [{}, {}, { speedPerAttack: 1 }],
  rock: [{ damageReduction: 0.08 }, { damageReduction: 0.16 }, { damageReduction: 0.2 }],
  ghost: [{ dodge: 0.05 }, { dodge: 0.08 }, { dodge: 0.15 }],
  dragon: [allStats(0.06), allStats(0.12), allStats(0.15)],
  dark: [{ crit: 0.05 }, { crit: 0.1 }, { crit: 0.15 }],
  steel: [{ maxHitTaken: 0.9 }, { maxHitTaken: 0.85 }, { maxHitTaken: 0.7 }],
  fairy: [{ koHeal: 0.1 }, { koHeal: 0.2 }, { koHeal: 0.25 }],
}

/** Una pasiva concreta: de qué tipo y de qué nivel (en los rivales se escriben a mano) */
export interface PassiveRef {
  type: PokeType
  level: PassiveLevel
}

/** Multiplicador de daño de un golpe crítico */
export const CRIT_MULT = 1.5

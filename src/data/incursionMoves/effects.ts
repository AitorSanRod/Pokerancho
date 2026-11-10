import type { StatusId } from '../passives'
import type { PokeType } from '../types'

// Cómo se escribe un ataque de incursión: potencia + lista de efectos. Por ejemplo, Absorber es
// `move(…, 40, [drain(0.5)])` (pega con potencia 40 y cura al propio la mitad del daño) y Deseo,
// `move(…, 20, [healTeam(0.2)])` (no pega: su potencia se convierte en cura para todo el grupo, sin contar tipos).

export const EffectKind = {
  /** Cura al propio Pokémon esa fracción del daño que hace */
  Drain: 'drain',
  /** Cura a un aliado (el que menos PS tenga o el elegido) esa fracción de la cura de su potencia */
  HealAlly: 'healAlly',
  /** Cura a todo el grupo esa fracción de la cura de su potencia */
  HealTeam: 'healTeam',
  /** Pone un estado alterado con esa probabilidad (al golpeado o, sin daño, a un rival) */
  Inflict: 'inflict',
  /** Sube etapas de stats a todo el grupo (o, con `self`, solo al que lo usa) hasta acabar la sala */
  Raise: 'raise',
  /** Baja etapas de stats a un rival (o a todos, con área) hasta acabar la sala */
  Lower: 'lower',
  /** Atrae los golpes de los rivales unos turnos y recibe menos daño */
  Taunt: 'taunt',
  /** El ataque va a todos los rivales y, con `allies`, también a sus compañeros (nunca a sí mismo) */
  Area: 'area',
} as const
export type EffectKind = (typeof EffectKind)[keyof typeof EffectKind]

export type BoostStat = 'atk' | 'def' | 'spe'

export const STAT_NAME: Record<BoostStat, string> = { atk: 'Ataque', def: 'Defensa', spe: 'Velocidad' }

/** Etapas que sube (positivas) o baja (negativas) una stat, como en los juegos: de −6 a +6 en total (fighter.ts) */
export interface StatChange {
  stat: BoostStat
  stages: number
}

export type MoveEffect =
  | { kind: typeof EffectKind.Drain; fraction: number }
  | { kind: typeof EffectKind.HealAlly; fraction: number }
  | { kind: typeof EffectKind.HealTeam; fraction: number }
  | { kind: typeof EffectKind.Inflict; status: StatusId; chance: number }
  | { kind: typeof EffectKind.Raise; changes: StatChange[]; self: boolean }
  | { kind: typeof EffectKind.Lower; changes: StatChange[] }
  | { kind: typeof EffectKind.Taunt; turns: number; guard: number }
  | { kind: typeof EffectKind.Area; allies: boolean }

export const drain = (fraction: number): MoveEffect => ({ kind: EffectKind.Drain, fraction })
export const healAlly = (fraction: number): MoveEffect => ({ kind: EffectKind.HealAlly, fraction })
export const healTeam = (fraction: number): MoveEffect => ({ kind: EffectKind.HealTeam, fraction })
export const inflict = (status: StatusId, chance = 1): MoveEffect => ({ kind: EffectKind.Inflict, status, chance })
export const raise = (changes: StatChange[]): MoveEffect => ({ kind: EffectKind.Raise, changes, self: false })
/** Como en los juegos con Danza Dragón o Corpulencia: sube solo al que lo usa */
export const raiseSelf = (changes: StatChange[]): MoveEffect => ({ kind: EffectKind.Raise, changes, self: true })
export const lower = (changes: StatChange[]): MoveEffect => ({ kind: EffectKind.Lower, changes })
export const taunt = (guard: number, turns = 3): MoveEffect => ({ kind: EffectKind.Taunt, turns, guard })
/** Como Avalancha: a todos los rivales */
export const area = (): MoveEffect => ({ kind: EffectKind.Area, allies: false })
/** Como Terremoto: a todos los rivales y también a sus compañeros */
export const areaAll = (): MoveEffect => ({ kind: EffectKind.Area, allies: true })

/** Toques que hacen falta en la ventana de toques para potenciar un ataque, si no dice otra cosa */
export const DEFAULT_TAP_GOAL = 100
/** Lo que mejora un ataque potenciado por los toques, si no dice otra cosa (0.1 = +10%) */
export const DEFAULT_TAP_BONUS = 0.1

export interface IncursionMove {
  id: string
  name: string
  type: PokeType
  /** Potencia: del golpe o, en los de cura, de la cura */
  power: number
  accuracy: number
  /** Como en los juegos: en cada turno actúan antes los de más prioridad y, a igual prioridad, los más rápidos */
  priority: number
  effects: MoveEffect[]
  /** Toques para potenciarlo en la ventana de toques */
  tapGoal: number
  /**
   * Mejora al potenciarlo: más daño (los de daño), más cura (los de cura) o más daño y cura del resto del grupo (los de
   * estado)
   */
  tapBonus: number
}

interface MoveOptions {
  accuracy?: number
  priority?: number
  tapGoal?: number
  tapBonus?: number
}

export const move = (id: string, name: string, type: PokeType, power: number, effects: MoveEffect[] = [], opts: MoveOptions = {}): IncursionMove => ({
  id,
  name,
  type,
  power,
  effects,
  accuracy: opts.accuracy ?? 100,
  priority: opts.priority ?? 0,
  tapGoal: opts.tapGoal ?? DEFAULT_TAP_GOAL,
  tapBonus: opts.tapBonus ?? DEFAULT_TAP_BONUS,
})

export const MoveClass = { Damage: 'damage', Heal: 'heal', Status: 'status' } as const
export type MoveClass = (typeof MoveClass)[keyof typeof MoveClass]

/** El primer efecto de esa clase que tiene el ataque, si lo tiene */
export const effectOf = <K extends EffectKind>(mv: IncursionMove, kind: K): Extract<MoveEffect, { kind: K }> | undefined =>
  mv.effects.find((e) => e.kind === kind) as Extract<MoveEffect, { kind: K }> | undefined

export const hasArea = (mv: IncursionMove): boolean => !!effectOf(mv, EffectKind.Area)

/** Si el ataque da también a los compañeros del que lo usa (como Terremoto) */
export const hitsAllies = (mv: IncursionMove): boolean => !!effectOf(mv, EffectKind.Area)?.allies

/**
 * Clase del ataque: de cura si su potencia se convierte en cura (a un aliado o al grupo); si no, de daño si tiene
 * potencia (aunque además cure, como Absorber); si no, de estado
 */
export function moveClass(mv: IncursionMove): MoveClass {
  if (effectOf(mv, EffectKind.HealAlly) || effectOf(mv, EffectKind.HealTeam)) return MoveClass.Heal
  return mv.power > 0 ? MoveClass.Damage : MoveClass.Status
}

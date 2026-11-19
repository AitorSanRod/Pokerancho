import type { PokeType } from '../types'

// Objetivos de las estrellas de una ruta (`stars` en kantoMaps.ts). La primera estrella es siempre completarla; las
// otras dos se eligen a mano en cada ruta con estos atajos: `stars: [starWith(POKEMON.Pidgey), starMinHp(50)]`. Las
// reglas, en game/run/routeStars.ts.

export const StarGoal = {
  Complete: 'complete',
  /** Salir con un Pokémon que no pase de un nivel */
  LevelCap: 'level-cap',
  /** Tener todas sus especies descubiertas en la Pokédex */
  SeeAll: 'see-all',
  /** Completarla con esa especie o una de sus evoluciones */
  WithSpecies: 'with-species',
  /** Completarla con un Pokémon de ese tipo */
  MonType: 'mon-type',
  /** Sin ninguna pasiva de rancho en toda la ruta */
  NoRanchPassives: 'no-ranch-passives',
  /** Con alguna pasiva de rancho y solo de esos tipos */
  OnlyPassiveTypes: 'only-passive-types',
  /** Sin bajar nunca de ese porcentaje de PS */
  MinHp: 'min-hp',
} as const
export type StarGoal = (typeof StarGoal)[keyof typeof StarGoal]

/** Lo que pide una estrella, con su dato */
export type StarGoalSpec =
  | { goal: typeof StarGoal.Complete }
  /** Sin `level`, el del rival más fuerte de la ruta */
  | { goal: typeof StarGoal.LevelCap; level?: number }
  | { goal: typeof StarGoal.SeeAll }
  | { goal: typeof StarGoal.WithSpecies; speciesId: number }
  | { goal: typeof StarGoal.MonType; type: PokeType }
  | { goal: typeof StarGoal.NoRanchPassives }
  | { goal: typeof StarGoal.OnlyPassiveTypes; types: PokeType[] }
  /** `percent`: % de los PS máximos por debajo del que no se puede bajar (1–99) */
  | { goal: typeof StarGoal.MinHp; percent: number }

/** Las dos estrellas que se eligen a mano en una ruta (la primera, completarla, va siempre) */
export type RouteStarGoals = [StarGoalSpec, StarGoalSpec]

/** Saliendo con un Pokémon de ese nivel o menos (sin nivel, el del rival más fuerte de la ruta) */
export const starLevel = (level?: number): StarGoalSpec => (level === undefined ? { goal: StarGoal.LevelCap } : { goal: StarGoal.LevelCap, level })
export const starSeeAll = (): StarGoalSpec => ({ goal: StarGoal.SeeAll })
/** Con esa especie o una de sus evoluciones: `starWith(POKEMON.Pidgey)` */
export const starWith = (speciesId: number): StarGoalSpec => ({ goal: StarGoal.WithSpecies, speciesId })
export const starType = (type: PokeType): StarGoalSpec => ({ goal: StarGoal.MonType, type })
export const starNoPassives = (): StarGoalSpec => ({ goal: StarGoal.NoRanchPassives })
/** Con alguna pasiva de rancho y solo de esos tipos: `starPassives('water', 'grass')` */
export const starPassives = (...types: PokeType[]): StarGoalSpec => ({ goal: StarGoal.OnlyPassiveTypes, types })
/** Sin bajar nunca de ese % de PS: `starMinHp(50)` */
export const starMinHp = (percent: number): StarGoalSpec => ({ goal: StarGoal.MinHp, percent })

import type { Biome } from '../maps/mapCommon'
import type { PassiveRef } from '../passives'
import type { StarItem } from '../starItems'
import type { Tm } from '../tms'

// Forma de una incursión: mazmorra de 5 jugadores con sus salas, rivales y premios (ver docs/incursiones.md). Cada
// incursión va en su fichero de esta carpeta y se añade a la lista de index.ts.

/** Id de cada incursión. El valor se guarda en la partida: no cambiarlo sin subir SAVE_VERSION */
export const IncursionId = { Prueba: 'prueba', CuevaHelada: 'cueva-helada' } as const
export type IncursionId = (typeof IncursionId)[keyof typeof IncursionId]

/** Dificultad: decide el precio de su llave */
export const IncursionTier = { Easy: 'easy', Medium: 'medium', Hard: 'hard' } as const
export type IncursionTier = (typeof IncursionTier)[keyof typeof IncursionTier]

/** ₽ que cuesta en la Tienda la llave de una incursión de cada dificultad */
export const KEY_PRICE: Record<IncursionTier, number> = {
  [IncursionTier.Easy]: 10_000,
  [IncursionTier.Medium]: 30_000,
  [IncursionTier.Hard]: 50_000,
}
/** Llaves de una misma incursión que se pueden tener a la vez */
export const MAX_KEYS = 10

/** Mecánicas de jefe: lo que lo hace exigente */
export interface BossMechanics {
  /** Desde el turno `fromTurn`, cada `every` turnos su Ataque sube `atk` etapas (hasta el tope, statStages.ts) */
  enrage?: { fromTurn: number; every: number; atk: number }
  /** Cada tantos turnos su golpe da a todo el grupo (con el daño rebajado, ver bossMechanics.ts) */
  areaEvery?: number
  /** Por debajo de esa fracción de PS cambia a otros ataques */
  phase?: { belowHp: number; moveIds: string[] }
}

export interface IncursionFoe {
  speciesId: number
  /** Su nivel: cada Pokémon del grupo lucha con el suyo, así que uno de más nivel termina antes */
  level: number
  /** Sus ataques (ver data/incursionMoves): en cada turno usa uno que tenga sentido (game/incursion/foeTactics.ts) */
  moveIds: string[]
  /** Multiplicador de sus PS máximos (los jefes aguantan a 5) */
  hpMult?: number
  passives?: PassiveRef[]
  boss?: BossMechanics
}

export const RoomKind = { Battle: 'battle', Heal: 'heal', Revive: 'revive', Regroup: 'regroup' } as const
export type RoomKind = (typeof RoomKind)[keyof typeof RoomKind]

export type IncursionRoom =
  | { kind: typeof RoomKind.Battle; name: string; foes: IncursionFoe[]; /** Lo que gana cada uno al superarla */ reward: { money: number; exp: number } }
  | { kind: typeof RoomKind.Heal; name: string; /** Fracción de los PS máximos que recuperan los que siguen en pie */ heal: number }
  | { kind: typeof RoomKind.Revive; name: string; /** Fracción de PS con la que se levantan todos los caídos */ hp: number }
  /** Cada jugador puede cambiar su movimiento: cierra un tramo (ver incursionLeg.ts) */
  | { kind: typeof RoomKind.Regroup; name: string }

/**
 * Qué da una línea de premio final. `Pieces`: tickets de esa especie. `StarItem`: objetos estelares (data/starItems.ts).
 * `Tm`: MTs (data/tms.ts)
 */
export const IncursionPrizeKind = { Money: 'money', Exp: 'exp', Tickets: 'tickets', Pieces: 'pieces', StarItem: 'starItem', Tm: 'tm' } as const
export type IncursionPrizeKind = (typeof IncursionPrizeKind)[keyof typeof IncursionPrizeKind]

/** Una línea de premio: cada una se tira por separado con su probabilidad (0 a 1) */
export type IncursionPrize =
  | { kind: typeof IncursionPrizeKind.Money | typeof IncursionPrizeKind.Exp | typeof IncursionPrizeKind.Tickets; amount: number; chance: number }
  | { kind: typeof IncursionPrizeKind.Pieces; speciesId: number; amount: number; chance: number }
  | { kind: typeof IncursionPrizeKind.StarItem; item: StarItem; amount: number; chance: number }
  | { kind: typeof IncursionPrizeKind.Tm; tm: Tm; amount: number; chance: number }

export interface Incursion {
  id: IncursionId
  name: string
  description: string
  biome: Biome
  tier: IncursionTier
  /** Nivel que necesita un Pokémon para entrar */
  minLevel: number
  /** Nivel por encima del cual un Pokémon ya no puede entrar */
  maxLevel: number
  rooms: IncursionRoom[]
  /** Premio al terminarla, para cada uno */
  prizes: IncursionPrize[]
  /** Especies que pueden llevar los bots que completan el grupo */
  bots: number[]
}

/** Un rival de una sala: especie, nivel y sus ataques (más jefe, pasivas o PS extra) */
export const foe = (speciesId: number, level: number, moveIds: string[], extra: Partial<IncursionFoe> = {}): IncursionFoe => ({
  speciesId,
  level,
  moveIds,
  ...extra,
})

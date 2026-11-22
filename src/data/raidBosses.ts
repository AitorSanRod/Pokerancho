import { POKEMON } from './pokemon'

// Jefes comunitarios opcionales (pestaña Raids): siempre hay uno activo; al caer sale el siguiente de la lista (y al
// acabarla, el primero). Los jefes comunitarios de las rutas son paradas `NodeKind.Raid` de cada ruta (kantoMaps.ts).
// Este fichero es para editarlo a mano: jefes, tablas de premios y nombres de los entrenadores bot.

/** Categoría de premios de un jefe comunitario: elige su tabla en RAID_PRIZE_TABLES */
export const RaidTier = { Low: 'low', Mid: 'mid', High: 'high', LowHard: 'lowHard', MidHard: 'midHard' } as const
export type RaidTier = (typeof RaidTier)[keyof typeof RaidTier]

export interface RaidBoss {
  speciesId: number
  level: number
  /** Nivel que necesita un Pokémon para entrar en su sala; sin él, puede entrar cualquiera */
  minLevel?: number
  /** Tabla de premios que da al caer */
  tier: RaidTier
  /** Multiplica las cantidades de su tabla de premios (₽, tickets, tickets del jefe y EXP); sin él, ×1 */
  prizeMult?: number
  /** Multiplica todas sus stats (PS, Ataque, Defensa y Velocidad): su vida en la pelea y sus golpes; sin él, ×1 */
  statMult?: number
}

/** Multiplicador de todas las stats de los jefes de la rotación «Difíciles» (HARD_RAID_BOSSES) */
export const HARD_RAID_STAT_MULT = 1.5

/** Jefes de la rotación «Normal» de la pestaña Raids (y de la pestaña sin servidor), en este orden */
export const RAID_BOSSES: RaidBoss[] = [
  { speciesId: POKEMON.Eevee, level: 20, minLevel: 10, tier: RaidTier.Low },
  { speciesId: POKEMON.Scyther, level: 35, minLevel: 15, tier: RaidTier.Mid },
  { speciesId: POKEMON.Pinsir, level: 45, minLevel: 25, tier: RaidTier.Mid },
  { speciesId: POKEMON.Lapras, level: 45, minLevel: 30, tier: RaidTier.Mid },
  { speciesId: POKEMON.Dragonite, level: 50, minLevel: 40, tier: RaidTier.High },
]

/**
 * Jefes de la rotación «Difíciles» de la pestaña Raids (solo con servidor; sale uno al azar cada vez): más nivel (y
 * por tanto más vida) que los de RAID_BOSSES y mejores premios (`prizeMult` multiplica las cantidades de su tabla)
 */
export const HARD_RAID_BOSSES: RaidBoss[] = [
  { speciesId: POKEMON.Togekiss, level: 50, minLevel: 45, tier: RaidTier.MidHard, prizeMult: 2.5 },
  { speciesId: POKEMON.Altaria, level: 60, minLevel: 45, tier: RaidTier.MidHard, prizeMult: 3 },
  { speciesId: POKEMON.Salamence, level: 70, minLevel: 55, tier: RaidTier.MidHard, prizeMult: 3.5 }
]

/** Qué da una línea de premio: `Exp` es EXP para el Pokémon que luchó contra el jefe (además de la que gana por minuto) */
export const RaidPrizeKind = { Money: 'money', Tickets: 'tickets', BossPieces: 'bossPieces', Exp: 'exp' } as const
export type RaidPrizeKind = (typeof RaidPrizeKind)[keyof typeof RaidPrizeKind]

/** Una línea de la tabla de premios: cada una se tira por separado con su probabilidad */
interface RaidPrizeRoll {
  kind: RaidPrizeKind
  amount: number
  /** Probabilidad de 0 a 1 */
  chance: number
}

/**
 * Premio de un jefe derrotado según su categoría, igual para todos los que cobran; `BossPieces` son tickets del propio
 * jefe. Cada línea se tira por separado
 */
export const RAID_PRIZE_TABLES: Record<RaidTier, RaidPrizeRoll[]> = {
  [RaidTier.Low]: [
    { kind: RaidPrizeKind.Money, amount: 100, chance: 1 },
    { kind: RaidPrizeKind.Money, amount: 150, chance: 0.75 },
    { kind: RaidPrizeKind.Money, amount: 500, chance: 0.5 },
    { kind: RaidPrizeKind.Money, amount: 1000, chance: 0.1 },
    { kind: RaidPrizeKind.Exp, amount: 100, chance: 1 },
    { kind: RaidPrizeKind.Exp, amount: 200, chance: 0.3 },
    { kind: RaidPrizeKind.Exp, amount: 300, chance: 0.3 },
    { kind: RaidPrizeKind.Exp, amount: 400, chance: 0.25 },
    { kind: RaidPrizeKind.Exp, amount: 500, chance: 0.1 },
    { kind: RaidPrizeKind.Tickets, amount: 1, chance: 1 },
    { kind: RaidPrizeKind.Tickets, amount: 1, chance: 0.5 },
    { kind: RaidPrizeKind.BossPieces, amount: 1, chance: 0.1 },
    { kind: RaidPrizeKind.BossPieces, amount: 1, chance: 0.2 },
    { kind: RaidPrizeKind.BossPieces, amount: 1, chance: 0.3 },
  ],
  [RaidTier.Mid]: [
    { kind: RaidPrizeKind.Money, amount: 250, chance: 1 },
    { kind: RaidPrizeKind.Money, amount: 500, chance: 0.1 },
    { kind: RaidPrizeKind.Money, amount: 250, chance: 0.15 },
    { kind: RaidPrizeKind.Money, amount: 1000, chance: 0.2 },
    { kind: RaidPrizeKind.Money, amount: 2000, chance: 0.1 },
    { kind: RaidPrizeKind.Exp, amount: 250, chance: 1 },
    { kind: RaidPrizeKind.Exp, amount: 400, chance: 0.25 },
    { kind: RaidPrizeKind.Exp, amount: 500, chance: 0.2 },
    { kind: RaidPrizeKind.Tickets, amount: 1, chance: 1 },
    { kind: RaidPrizeKind.Tickets, amount: 1, chance: 0.25 },
    { kind: RaidPrizeKind.BossPieces, amount: 1, chance: 0.15 },
    { kind: RaidPrizeKind.BossPieces, amount: 1, chance: 0.1 },
  ],
  [RaidTier.High]: [
    { kind: RaidPrizeKind.Money, amount: 1000, chance: 1 },
    { kind: RaidPrizeKind.Money, amount: 2000, chance: 0.75 },
    { kind: RaidPrizeKind.Money, amount: 3000, chance: 0.5 },
    { kind: RaidPrizeKind.Money, amount: 5000, chance: 0.25 },
    { kind: RaidPrizeKind.Exp, amount: 1800, chance: 1 },
    { kind: RaidPrizeKind.Exp, amount: 2500, chance: 0.25 },
    { kind: RaidPrizeKind.Tickets, amount: 2, chance: 1 },
    { kind: RaidPrizeKind.BossPieces, amount: 1, chance: 0.5 },
    { kind: RaidPrizeKind.BossPieces, amount: 2, chance: 0.1 },
  ],
  [RaidTier.LowHard]: [
    { kind: RaidPrizeKind.Money, amount: 1000, chance: 1 },
    { kind: RaidPrizeKind.Money, amount: 2000, chance: 0.5 },
    { kind: RaidPrizeKind.Money, amount: 3000, chance: 0.25 },
    { kind: RaidPrizeKind.Money, amount: 3000, chance: 0.1 },
    { kind: RaidPrizeKind.Exp, amount: 1000, chance: 1 },
    { kind: RaidPrizeKind.Exp, amount: 1200, chance: 0.3 },
    { kind: RaidPrizeKind.Exp, amount: 1500, chance: 0.1 },
    { kind: RaidPrizeKind.Tickets, amount: 2, chance: 1 },
    { kind: RaidPrizeKind.Tickets, amount: 1, chance: 0.75 },
    { kind: RaidPrizeKind.Tickets, amount: 1, chance: 0.5 },
  ],
  [RaidTier.MidHard]: [
    { kind: RaidPrizeKind.Money, amount: 5000, chance: 1 },
    { kind: RaidPrizeKind.Money, amount: 5000, chance: 0.5 },
    { kind: RaidPrizeKind.Money, amount: 5000, chance: 0.25 },
    { kind: RaidPrizeKind.Money, amount: 5000, chance: 0.1 },
    { kind: RaidPrizeKind.Exp, amount: 1500, chance: 1 },
    { kind: RaidPrizeKind.Exp, amount: 2000, chance: 0.5 },
    { kind: RaidPrizeKind.Exp, amount: 5000, chance: 0.2 },
    { kind: RaidPrizeKind.Tickets, amount: 5, chance: 1 },
    { kind: RaidPrizeKind.Tickets, amount: 2, chance: 0.1 },
    { kind: RaidPrizeKind.Tickets, amount: 1, chance: 0.1 },
    { kind: RaidPrizeKind.BossPieces, amount: 1, chance: 0.1 },
    { kind: RaidPrizeKind.BossPieces, amount: 1, chance: 0.1 },
    { kind: RaidPrizeKind.BossPieces, amount: 2, chance: 0.1 },
  ],
}

/** Nombres de los entrenadores bot que entran y salen de la sala (provisional hasta tener jugadores reales) */
export const BOT_TRAINERS = ['Lucía', 'Marcos', 'Nerea', 'Iker', 'Carla', 'Hugo', 'Alba', 'Dani', 'Irene', 'Pablo', 'Sara', 'Rubén']

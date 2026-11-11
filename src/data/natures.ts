/** Stats que puede subir o bajar una naturaleza (los PS no cambian, como en los juegos) */
export type NatureStat = 'atk' | 'def' | 'spe'

/** Naturalezas por su nombre en el código (p. ej. `Nature.Bold`): la seria no sube ni baja nada */
export const Nature = {
  Serious: 'serious',
  Lonely: 'lonely',
  Brave: 'brave',
  Bold: 'bold',
  Relaxed: 'relaxed',
  Timid: 'timid',
  Hasty: 'hasty',
} as const
export type Nature = (typeof Nature)[keyof typeof Nature]

export interface NatureInfo {
  name: string
  /** Stat que sube; null en la neutra */
  up: NatureStat | null
  /** Stat que baja; null en la neutra */
  down: NatureStat | null
}

export const NATURES: Record<Nature, NatureInfo> = {
  serious: { name: 'Seria', up: null, down: null },
  lonely: { name: 'Huraña', up: 'atk', down: 'def' },
  brave: { name: 'Audaz', up: 'atk', down: 'spe' },
  bold: { name: 'Osada', up: 'def', down: 'atk' },
  relaxed: { name: 'Plácida', up: 'def', down: 'spe' },
  timid: { name: 'Miedosa', up: 'spe', down: 'atk' },
  hasty: { name: 'Activa', up: 'spe', down: 'def' },
}

/** La de los Pokémon que ya existían antes de las naturalezas */
export const NEUTRAL_NATURE: Nature = Nature.Serious

/** Fondo de un rancho, que elige el jugador. El valor se guarda en la partida: no cambiarlo sin subir SAVE_VERSION */
export const RanchBackdrop = {
  Meadow: 'meadow',
  Desert: 'desert',
  Beach: 'beach',
  Forest: 'forest',
} as const
export type RanchBackdrop = (typeof RanchBackdrop)[keyof typeof RanchBackdrop]

/** Fondo de los ranchos a los que el jugador no ha puesto otro */
export const DEFAULT_RANCH_BACKDROP = RanchBackdrop.Meadow

/** Nombre de cada fondo, en el orden en que se ofrecen (las imágenes, en ui/ranch/ranchLooks.ts) */
export const RANCH_BACKDROPS: Record<RanchBackdrop, { name: string }> = {
  [RanchBackdrop.Meadow]: { name: 'Pradera' },
  [RanchBackdrop.Desert]: { name: 'Desierto' },
  [RanchBackdrop.Beach]: { name: 'Playa' },
  [RanchBackdrop.Forest]: { name: 'Bosque' },
}

export const isRanchBackdrop = (v: unknown): v is RanchBackdrop => typeof v === 'string' && v in RANCH_BACKDROPS

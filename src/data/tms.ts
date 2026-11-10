import { IMOVE, type IncursionMove } from './incursionMoves'
import { ITEM, type Item } from './items'
import { PokeType } from './types'

// MTs: objetos de un solo uso que enseñan para siempre un ataque de incursión a un Pokémon de los tipos que dice. No se
// compran: salen como premio de incursión (con poca probabilidad) y se intercambian entre jugadores. Para editar a mano.

/**
 * Cada MT por el ataque que enseña (`Tm.Senuelo`, como `IMOVE.Senuelo`). El valor es el id del ataque y se guarda en
 * la partida: no cambiarlo sin subir SAVE_VERSION
 */
export const Tm = { Senuelo: 'follow-me' } as const
export type Tm = (typeof Tm)[keyof typeof Tm]

interface TmInfo {
  move: IncursionMove
  /** La aprenden los Pokémon que tienen alguno de estos tipos */
  types: PokeType[]
  item: Item
}

export const TMS: Record<Tm, TmInfo> = {
  [Tm.Senuelo]: { move: IMOVE.Senuelo, types: [PokeType.Normal], item: ITEM.TmNormal },
}

export const TM_IDS = Object.values(Tm)

export const isTm = (v: unknown): v is Tm => (TM_IDS as unknown[]).includes(v)

/** «MT Señuelo» */
export const tmName = (tm: Tm): string => `MT ${TMS[tm].move.name}`

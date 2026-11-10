// Obsequio diario de las cuentas (ver game/collection/dailyGift.ts). Este fichero es para editarlo a mano: cada
// entrada es un día del ciclo, en orden; al recoger el último se vuelve al primero.

import { StarItem } from './starItems'

/** Lo que da un día del ciclo */
export interface DailyGift {
  money: number
  /** Trozos de MissingNo */
  missingnoShards: number
  /** Tickets de gacha */
  tickets: number
  /** Objetos estelares (ver data/starItems.ts) */
  starItems: Partial<Record<StarItem, number>>
  /** Día grande: se destaca en la lista */
  big: boolean
}

const gift = (contents: Partial<DailyGift>): DailyGift => ({ money: 0, missingnoShards: 0, tickets: 0, starItems: {}, big: false, ...contents })

/** Los días del ciclo, en orden */
export const DAILY_GIFTS: DailyGift[] = [
  gift({ tickets: 10 }),
  gift({ money: 10000 }),
  gift({ tickets: 5, starItems: { [StarItem.Stardust]: 1 } }),
  gift({ missingnoShards: 200 }),
  gift({ missingnoShards: 300, starItems: { [StarItem.Stardust]: 2 } }),
  gift({ money: 5000 }),
  gift({ money: 20000, missingnoShards: 500, tickets: 10, starItems: { [StarItem.StarPiece]: 1 }, big: true }),
]

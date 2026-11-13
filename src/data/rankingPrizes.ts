import { giftContents, type GiftContents } from './dailyGifts'
import { StarItem } from './starItems'

// Premios semanales de los rankings (ver game/core/rankingPrizes.ts). Este fichero es para editarlo a mano. Cada lunes
// a las 00:00 UTC el servidor reparte los de la semana que acaba como regalos en Notificaciones: el del puesto 1, 2 o 3
// a quien lo ocupe (los empates comparten puesto y premio) y el de participación a todos los demás que salen en el ranking.

/** Rankings semanales que dan premio */
export const WeeklyBoard = { Damage: 'damage', Tower: 'tower' } as const
export type WeeklyBoard = (typeof WeeklyBoard)[keyof typeof WeeklyBoard]

export interface BoardPrizes {
  /** Premio del 1.º, del 2.º y del 3.º, en ese orden */
  podium: [GiftContents, GiftContents, GiftContents]
  /** Premio de participación: para todos los demás que salen en el ranking */
  rest: GiftContents
}

/** Días que se puede recoger el premio en Notificaciones antes de que caduque */
export const RANKING_PRIZE_DAYS = 7

export const RANKING_PRIZES: Record<WeeklyBoard, BoardPrizes> = {
  [WeeklyBoard.Damage]: {
    podium: [
      giftContents({ money: 50000, tickets: 50, starItems: { [StarItem.CometShard]: 1 } }),
      giftContents({ money: 30000, tickets: 25, starItems: { [StarItem.StarPiece]: 2 } }),
      giftContents({ money: 20000, tickets: 10, starItems: { [StarItem.Stardust]: 3 } }),
    ],
    rest: giftContents({ money: 5000, tickets: 5 }),
  },
  [WeeklyBoard.Tower]: {
    podium: [
      giftContents({ money: 75000, tickets: 20, starItems: { [StarItem.CometShard]: 1 } }),
      giftContents({ money: 50000, tickets: 12, starItems: { [StarItem.StarPiece]: 2 } }),
      giftContents({ money: 25000, tickets: 8, starItems: { [StarItem.Stardust]: 3 } }),
    ],
    rest: giftContents({ money: 10000, tickets: 5 }),
  },
}

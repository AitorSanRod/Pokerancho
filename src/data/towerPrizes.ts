// Premios de la torre infinita (ver game/tower/towerRewards.ts). Este fichero es para editarlo a mano: cada
// TOWER_PRIZE_EVERY pisos hay un premio, que se cobra solo la primera vez que se gana ese piso (al batir el récord).

import { giftContents, type GiftContents } from './dailyGifts'
import { StarItem } from './starItems'

/** Cada cuántos pisos hay premio */
export const TOWER_PRIZE_EVERY = 10

/** Premio de los pisos TOWER_PRIZE_EVERY, 2 × TOWER_PRIZE_EVERY…, en orden */
export const TOWER_PRIZES: GiftContents[] = [
  giftContents({ money: 2000 }),
  giftContents({ tickets: 3 }),
  giftContents({ money: 5000, missingnoShards: 5 }),
  giftContents({ tickets: 5 }),
  giftContents({ money: 10000, starItems: { [StarItem.Stardust]: 1 } }),
  giftContents({ tickets: 8 }),
  giftContents({ money: 15000, missingnoShards: 10 }),
  giftContents({ tickets: 10 }),
  giftContents({ money: 20000, starItems: { [StarItem.StarPiece]: 1 } }),
  giftContents({ tickets: 15, starItems: { [StarItem.CometShard]: 1 } }),
]

/** Premio de cada TOWER_PRIZE_EVERY pisos pasada la lista */
export const TOWER_LATE_PRIZE: GiftContents = giftContents({ money: 10000, tickets: 5 })

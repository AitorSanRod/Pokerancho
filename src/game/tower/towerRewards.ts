import type { GiftContents } from '../../data/dailyGifts'
import { TOWER_LATE_PRIZE, TOWER_PRIZE_EVERY, TOWER_PRIZES } from '../../data/towerPrizes'
import { boostedMoney, moneyPerStep } from '../battle/rewards'
import { applyGift } from '../collection/dailyGift'
import { addPieces } from '../collection/pieces'
import type { GameState, OwnedMon } from '../core/state'
import { gainExp } from '../team/stats'
import { floorsPastCap, pastLevelCap, TOWER_STAT_GROWTH, towerLevel } from './towerFoes'

// Premios de la torre infinita, piso a piso: EXP para el Pokémon que sube y ₽ que crecen con el nivel del rival (y,
// pasado el último piso de nivel, con lo que suben sus stats); cada pocos pisos, el premio de data/towerPrizes.ts la
// primera vez que se gana ese piso, y, pasado el último piso de nivel, un ticket del Pokémon derrotado.

/** EXP por victoria por cada nivel del rival (en las rutas, battle/rewards.ts › EXP_PER_LEVEL) */
export const TOWER_EXP_PER_LEVEL = 4
/** Pasos de ruta a los que equivale cada piso para el ₽ (se paga como un combate de ruta tras tantos pasos) */
export const TOWER_MONEY_STEPS = 20

/** Lo ganado en una subida a la torre; `pieces`, la especie de cada ticket ganado; `prizes`, los premios de piso */
export interface TowerEarned {
  money: number
  exp: number
  levelsGained: number
  pieces: number[]
  prizes: GiftContents[]
}

export const noTowerEarned = (): TowerEarned => ({ money: 0, exp: 0, levelsGained: 0, pieces: [], prizes: [] })

/** Cuánto más dan los pisos pasado el último de nivel: lo mismo que suben las stats del rival */
const pastCapMult = (floor: number): number => 1 + floorsPastCap(floor) * TOWER_STAT_GROWTH

export const floorExp = (floor: number): number => Math.round(towerLevel(floor) * TOWER_EXP_PER_LEVEL * pastCapMult(floor))

export const floorMoney = (floor: number): number => Math.max(1, boostedMoney(moneyPerStep(towerLevel(floor)) * TOWER_MONEY_STEPS * pastCapMult(floor)))

export const isPrizeFloor = (floor: number): boolean => floor % TOWER_PRIZE_EVERY === 0

/** El premio de ese piso (de la lista o, pasada ella, el de después); null si no es piso de premio */
export function towerPrize(floor: number): GiftContents | null {
  if (!isPrizeFloor(floor)) return null
  return TOWER_PRIZES[floor / TOWER_PRIZE_EVERY - 1] ?? TOWER_LATE_PRIZE
}

/** El siguiente piso con premio por encima del récord `best` */
export const nextPrizeFloor = (best: number): number => (Math.floor(best / TOWER_PRIZE_EVERY) + 1) * TOWER_PRIZE_EVERY

/** Premio de ganar un piso, tal y como sale al acabar el combate; `piece`, un ticket del rival */
export interface FloorPrize {
  money: number
  exp: number
  piece: boolean
  /** Premio del piso, si es la primera vez que se gana */
  prize: GiftContents | null
}

/** Lo que da ganar el piso `floor`; `best`, el récord de antes de esta subida */
export const floorPrize = (floor: number, best: number): FloorPrize => ({
  money: floorMoney(floor),
  exp: floorExp(floor),
  piece: pastLevelCap(floor),
  prize: floor > best ? towerPrize(floor) : null,
})

/** Cobra lo de ganar un piso a `foeId` con `mon` y lo apunta en lo ganado en la subida */
export function rewardFloor(s: GameState, mon: OwnedMon, earned: TowerEarned, foeId: number, got: FloorPrize) {
  earned.exp += got.exp
  earned.levelsGained += gainExp(mon, got.exp).levelsGained
  s.money += got.money
  earned.money += got.money
  if (got.prize) {
    applyGift(s, got.prize)
    earned.prizes.push(got.prize)
  }
  if (!got.piece) return
  addPieces(s, foeId, 1)
  earned.pieces.push(foeId)
}

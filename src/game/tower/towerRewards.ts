import type { GiftContents } from '../../data/dailyGifts'
import { TOWER_LATE_PRIZE, TOWER_PRIZE_EVERY, TOWER_PRIZES } from '../../data/towerPrizes'
import { boostedMoney, expForLevel, moneyPerStep } from '../battle/rewards'
import { applyGift } from '../collection/dailyGift'
import { addPieces } from '../collection/pieces'
import type { Rng } from '../core/random'
import type { GameState, OwnedMon } from '../core/state'
import { gainExp } from '../team/stats'
import { floorsPastCap, pastLevelCap, TOWER_STAT_GROWTH, towerLevel } from './towerFoes'

// Premios de la torre infinita, piso a piso: EXP para el Pokémon que sube y ₽ que crecen con el nivel del rival (y,
// pasado el último piso de nivel, con lo que suben sus stats); cada pocos pisos, el premio de data/towerPrizes.ts la
// primera vez de la semana que se gana ese piso (towerWeek.ts); pasado el último piso de nivel, un ticket del Pokémon
// derrotado, y, en cualquiera, a veces un Huevo Suerte en la escena, que solo se gana si se toca (towerEgg.ts).

/** EXP por victoria por cada nivel del rival, antes de crecer con el nivel (en las rutas, battle/rewards.ts › EXP_PER_LEVEL y expForLevel) */
export const TOWER_EXP_PER_LEVEL = 4
/**
 * Recorte de la EXP que gana en la torre el Pokémon que sube, según su nivel al ganar el piso: desde `fromLevel`, la EXP
 * del piso × `mult` (de mayor a menor nivel; por debajo del último, sin recorte). Solo la EXP: el ₽ y los premios, no
 */
export const TOWER_EXP_LEVEL_CUTS: readonly { fromLevel: number; mult: number }[] = [
  { fromLevel: 90, mult: 0.75 },
  { fromLevel: 75, mult: 0.8 },
  { fromLevel: 50, mult: 0.9 },
]
/** Pasos de ruta a los que equivale cada piso para el ₽ (se paga como un combate de ruta tras tantos pasos) */
export const TOWER_MONEY_STEPS = 20
/** Probabilidad (0–1) de que, al ganar un piso, salga un Huevo Suerte en la escena (hay que tocarlo: towerEgg.ts) */
export const TOWER_EGG_CHANCE = 0.025

/** Lo ganado en una subida a la torre; `pieces`, la especie de cada ticket ganado; `prizes`, los premios de piso; `eggs`, Huevos Suerte tocados */
export interface TowerEarned {
  money: number
  exp: number
  levelsGained: number
  pieces: number[]
  prizes: GiftContents[]
  eggs: number
}

export const noTowerEarned = (): TowerEarned => ({ money: 0, exp: 0, levelsGained: 0, pieces: [], prizes: [], eggs: 0 })

/** Cuánto más dan los pisos pasado el último de nivel: lo mismo que suben las stats del rival */
const pastCapMult = (floor: number): number => 1 + floorsPastCap(floor) * TOWER_STAT_GROWTH

export const floorExp = (floor: number): number => Math.round(expForLevel(towerLevel(floor), TOWER_EXP_PER_LEVEL) * pastCapMult(floor))

/** Multiplicador de la EXP de la torre para un Pokémon de ese nivel (TOWER_EXP_LEVEL_CUTS) */
export const towerExpMult = (level: number): number => TOWER_EXP_LEVEL_CUTS.find((cut) => level >= cut.fromLevel)?.mult ?? 1

export const floorMoney = (floor: number): number => Math.max(1, boostedMoney(moneyPerStep(towerLevel(floor)) * TOWER_MONEY_STEPS * pastCapMult(floor)))

export const isPrizeFloor = (floor: number): boolean => floor % TOWER_PRIZE_EVERY === 0

/** El premio de ese piso (de la lista o, pasada ella, el de después); null si no es piso de premio */
export function towerPrize(floor: number): GiftContents | null {
  if (!isPrizeFloor(floor)) return null
  return TOWER_PRIZES[floor / TOWER_PRIZE_EVERY - 1] ?? TOWER_LATE_PRIZE
}

/** El siguiente piso con premio por encima del récord `best` */
export const nextPrizeFloor = (best: number): number => (Math.floor(best / TOWER_PRIZE_EVERY) + 1) * TOWER_PRIZE_EVERY

/** Premio de ganar un piso, tal y como sale al acabar el combate; `piece`, un ticket del rival; `egg`, sale un Huevo Suerte para tocarlo */
export interface FloorPrize {
  money: number
  exp: number
  piece: boolean
  egg: boolean
  /** Premio del piso, si es la primera vez de la semana que se gana */
  prize: GiftContents | null
}

/** Lo que da ganar el piso `floor`; `best`, el piso más alto ya superado esta semana (el Huevo Suerte, al azar) */
export const floorPrize = (floor: number, best: number, rng: Rng = Math.random): FloorPrize => ({
  money: floorMoney(floor),
  exp: floorExp(floor),
  piece: pastLevelCap(floor),
  egg: rng() < TOWER_EGG_CHANCE,
  prize: floor > best ? towerPrize(floor) : null,
})

/** Cobra lo de ganar un piso a `foeId` con `mon` (la EXP, recortada según su nivel) y lo apunta en lo ganado en la subida */
export function rewardFloor(s: GameState, mon: OwnedMon, earned: TowerEarned, foeId: number, got: FloorPrize) {
  const exp = Math.round(got.exp * towerExpMult(mon.level))
  earned.exp += exp
  earned.levelsGained += gainExp(mon, exp).levelsGained
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

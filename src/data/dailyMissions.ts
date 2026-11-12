// Misiones diarias (ver game/collection/missions.ts). Este fichero es para editarlo a mano: cada día salen
// MISSIONS_PER_DAY misiones distintas al azar de esta lista, cada una con su objetivo y su premio.

import { giftContents, type GiftContents } from './dailyGifts'

/** Qué pide una misión */
export const MissionKind = {
  /** Ganar combates en ruta */
  WinBattles: 'winBattles',
  /** Completar rutas, las que sean */
  CompleteRoutes: 'completeRoutes',
  /** Completar una ruta concreta de las ya desbloqueadas */
  CompleteRoute: 'completeRoute',
  /** Completar rutas con un Pokémon concreto de compañero (uno que se tiene o se puede crear ya) */
  CompleteRouteWith: 'completeRouteWith',
  /** Gastar ₽ en la tienda, el gacha, crear, evolucionar, curar o entrenar */
  SpendMoney: 'spendMoney',
  /** Crear Pokémon nuevos en la Pokédex */
  CreateMons: 'createMons',
  /** Abrir tickets de gacha */
  PullGacha: 'pullGacha',
  /** Recoger expediciones terminadas */
  FinishExpeditions: 'finishExpeditions',
} as const
export type MissionKind = (typeof MissionKind)[keyof typeof MissionKind]

export interface MissionTemplate {
  kind: MissionKind
  /** Cuántas veces (o cuántos ₽, en SpendMoney) hay que hacerlo */
  goal: number
  reward: GiftContents
}

/** Misiones que salen cada día */
export const MISSIONS_PER_DAY = 3

/** Todas las misiones posibles, con su objetivo y su premio */
export const DAILY_MISSIONS: MissionTemplate[] = [
  { kind: MissionKind.WinBattles, goal: 20, reward: giftContents({ money: 3000 }) },
  { kind: MissionKind.CompleteRoutes, goal: 3, reward: giftContents({ tickets: 3 }) },
  { kind: MissionKind.CompleteRoute, goal: 1, reward: giftContents({ money: 2500 }) },
  { kind: MissionKind.CompleteRouteWith, goal: 1, reward: giftContents({ money: 2000, tickets: 2 }) },
  { kind: MissionKind.SpendMoney, goal: 10000, reward: giftContents({ missingnoShards: 100 }) },
  { kind: MissionKind.CreateMons, goal: 1, reward: giftContents({ tickets: 3 }) },
  { kind: MissionKind.PullGacha, goal: 5, reward: giftContents({ money: 2500 }) },
  { kind: MissionKind.FinishExpeditions, goal: 2, reward: giftContents({ missingnoShards: 80 }) },
]

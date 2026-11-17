import { MissionKind } from '../../data/dailyMissions'
import { advanceMission } from '../collection/missions'
import type { GameState } from './state'

/** Paga `amount` ₽ (quien llama ya ha comprobado que llega): cuenta para la misión diaria de gastar */
export function spendMoney(s: GameState, amount: number) {
  s.money -= amount
  advanceMission(s, MissionKind.SpendMoney, amount)
}

/** Retiene `amount` ₽ (una fianza; como mucho, lo que tenga): sale del dinero, pero no cuenta como gastado para las misiones. Devuelve lo retenido */
export function holdMoney(s: GameState, amount: number): number {
  const held = Math.max(0, Math.min(amount, s.money))
  s.money -= held
  return held
}

/** Devuelve ₽ retenidos (o los de un reparto de fianzas) */
export function releaseMoney(s: GameState, amount: number) {
  s.money += amount
}

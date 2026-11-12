import { MissionKind } from '../../data/dailyMissions'
import { advanceMission } from '../collection/missions'
import type { GameState } from './state'

/** Paga `amount` ₽ (quien llama ya ha comprobado que llega): cuenta para la misión diaria de gastar */
export function spendMoney(s: GameState, amount: number) {
  s.money -= amount
  advanceMission(s, MissionKind.SpendMoney, amount)
}

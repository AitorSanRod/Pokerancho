import { claimableMissions } from '../../game/collection/missions'
import { pendingServerGifts } from '../../game/collection/serverGifts'
import type { GameState } from '../../game/core/state'
import { giftReady, useDailyGift } from '../../net/dailyGift'
import { useServerGifts } from '../../net/serverGifts'
import { useTradeBoard } from '../../net/tradeBoard'
import { pendingKey } from '../shared/useUnseen'

/**
 * Resumen de lo que espera en el Menú del rancho (Notificaciones: obsequio, regalos del servidor, premios de raid e
 * intercambios; y misiones por cobrar) para `useUnseen`: el punto de la pestaña Rancho y el del botón Menú
 */
export function useMenuPending(game: GameState): string | null {
  const gift = useDailyGift()
  const serverGifts = pendingServerGifts(game, useServerGifts())
  const trades = useTradeBoard().board?.inbox ?? []
  const missions = claimableMissions(game)
  return pendingKey([
    ...(giftReady(gift) && gift.state ? [`gift:${gift.state.claimed}`] : []),
    ...serverGifts.map((g) => `server:${g.id}`),
    ...game.raidPrizes.map((p) => `prize:${p.bossSpeciesId}:${p.uid}`),
    ...trades.map((e) => `trade:${e.id}`),
    ...(missions > 0 ? [`missions:${game.missions?.day}:${missions}`] : []),
  ])
}

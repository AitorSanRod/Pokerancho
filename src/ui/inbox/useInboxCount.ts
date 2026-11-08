import { pendingServerGifts } from '../../game/collection/serverGifts'
import type { GameState } from '../../game/core/state'
import { giftReady, useDailyGift } from '../../net/dailyGift'
import { useServerGifts } from '../../net/serverGifts'
import { useTradeBoard } from '../../net/tradeBoard'

/** Cuántas cosas hay en Notificaciones: el obsequio si está listo, los regalos del servidor, los premios de raid y lo de los intercambios */
export function useInboxCount(game: GameState): number {
  const gift = useDailyGift()
  const trades = useTradeBoard().board?.inbox.length ?? 0
  const serverGifts = pendingServerGifts(game, useServerGifts()).length
  return (giftReady(gift) ? 1 : 0) + serverGifts + game.raidPrizes.length + trades
}

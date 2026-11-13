import type { GiftContents } from '../../data/dailyGifts'
import { RANKING_PRIZE_DAYS, RANKING_PRIZES, WeeklyBoard } from '../../data/rankingPrizes'
import { DAY_MS, rankingWeek } from './ranking'

// Premios semanales de los rankings de daño y de la torre (números en data/rankingPrizes.ts). Los reparte el servidor
// (worker/db/rankingAwards.ts) el lunes, como regalos del servidor para cada cuenta (ver collection/serverGifts.ts).

/** Nombre de cada ranking en el título del premio */
const BOARD_NAME: Record<WeeklyBoard, string> = {
  [WeeklyBoard.Damage]: 'daño a jefes',
  [WeeklyBoard.Tower]: 'la torre',
}

/** Inicio (ms) del periodo que acaba de terminar en `now` (una semana o menos, si hubo un corte extra): el que se premia */
export const prizedWeek = (now: number, cuts?: readonly number[]): number => rankingWeek(rankingWeek(now, cuts) - 1, cuts)

/** Premio de un puesto (1 = primero): el del podio hasta el 3.º y el de participación para los demás */
export const prizeForRank = (board: WeeklyBoard, rank: number): GiftContents => RANKING_PRIZES[board].podium[rank - 1] ?? RANKING_PRIZES[board].rest

const placeText = (rank: number): string => (rank <= RANKING_PRIZES[WeeklyBoard.Tower].podium.length ? `${rank}.º puesto` : `puesto ${rank}`)

const weekText = (week: number): string => new Date(week).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', timeZone: 'UTC' })

/** Lo que se apunta en server_gifts para el premio de una cuenta: id único por ranking, semana y cuenta, título y contenido */
export interface RankingPrizeGift {
  id: string
  title: string
  goods: GiftContents
  expiresAt: number
}

export function rankingPrizeGift(board: WeeklyBoard, week: number, userId: string, rank: number, now: number): RankingPrizeGift {
  const day = new Date(week).toISOString().slice(0, 10).replaceAll('-', '')
  return {
    id: `ranking-${board}-${day}-${userId.toLowerCase()}`,
    title: `Ranking de ${BOARD_NAME[board]}, semana del ${weekText(week)}: ${placeText(rank)}`,
    goods: prizeForRank(board, rank),
    expiresAt: now + RANKING_PRIZE_DAYS * DAY_MS,
  }
}

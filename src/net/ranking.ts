import { RankingCode, type DamageRankingView, type RankingView, type TowerRankingView } from '../game/core/ranking'

// Los rankings de dinero, de daño a los jefes y de la torre (worker/ranking.ts): se piden al abrirlos desde el menú; el servidor los
// rehace cada hora.

const RANKING_API = '/api/ranking'

/**
 * Lo que trae una consulta: las fotos, por qué no se pueden ver o que no se ha podido conectar. La de la torre es null si
 * el servidor aún no la tiene
 */
export type RankingResult = { view: RankingView; damage: DamageRankingView; tower: TowerRankingView | null } | { code: RankingCode } | { failed: true }

export async function fetchRanking(): Promise<RankingResult> {
  try {
    const res = await fetch(RANKING_API, { cache: 'no-store' })
    const body = (await res.json()) as { ranking?: RankingView; damage?: DamageRankingView; tower?: TowerRankingView; code?: string }
    if (body.ranking && body.damage) return { view: body.ranking, damage: body.damage, tower: body.tower ?? null }
    if (Object.values<string>(RankingCode).includes(body.code ?? '')) return { code: body.code as RankingCode }
  } catch {
    // Sin conexión: se avisa abajo
  }
  return { failed: true }
}

import { RANKING_ACTIVE_MS, RANKING_SIZE, type TowerRankingEntry, type TowerRankingView } from '../../src/game/core/ranking'
import { RANKED_USERS } from './users'

// El ranking de la torre infinita en D1 (tabla tower_ranking, migrations/0015_tower_ranking.sql): el piso más alto
// (towerBest) de la partida en la nube de cada cuenta, rehecho cada hora junto a la foto del dinero y con sus permisos.

/** Sentencias que rehacen la foto: cuentas visibles con algún piso y la partida subida hace poco; empates, mismo puesto */
export const rebuildTowerStatements = (db: D1Database, now: number): D1PreparedStatement[] => [
  db.prepare('DELETE FROM tower_ranking'),
  db
    .prepare(
      `INSERT INTO tower_ranking (user_id, rank, floor)
       SELECT user_id, RANK() OVER (ORDER BY floor DESC), floor FROM (
         SELECT saves.user_id, CAST(json_extract(saves.data, '$.save.towerBest') AS INTEGER) AS floor
         FROM saves JOIN users ON users.id = saves.user_id
         WHERE ${RANKED_USERS} AND saves.updated_at >= ?
       ) WHERE floor > 0`,
    )
    .bind(now - RANKING_ACTIVE_MS),
]

interface EntryRow {
  rank: number
  nickname: string
  floor: number
  mine: number
}

/** La foto vista por la cuenta `userId`; `builtAt` es la de la foto del dinero, que se hace a la vez */
export async function loadTowerRanking(db: D1Database, userId: string, builtAt: number | null): Promise<TowerRankingView> {
  const [top, mine, count] = await Promise.all([
    db
      .prepare(
        `SELECT tower_ranking.rank, users.nickname, tower_ranking.floor, tower_ranking.user_id = ? AS mine
         FROM tower_ranking JOIN users ON users.id = tower_ranking.user_id
         WHERE ${RANKED_USERS} ORDER BY tower_ranking.rank, users.nickname LIMIT ?`,
      )
      .bind(userId, RANKING_SIZE)
      .all<EntryRow>(),
    db.prepare('SELECT rank, floor FROM tower_ranking WHERE user_id = ?').bind(userId).first<{ rank: number; floor: number }>(),
    db.prepare(`SELECT COUNT(*) AS total FROM tower_ranking JOIN users ON users.id = tower_ranking.user_id WHERE ${RANKED_USERS}`).first<number>('total'),
  ])
  const entries: TowerRankingEntry[] = top.results.map((r) => ({ rank: r.rank, nickname: r.nickname, floor: r.floor, mine: r.mine === 1 }))
  return { top: entries, mine: mine ?? null, total: count ?? 0, builtAt }
}

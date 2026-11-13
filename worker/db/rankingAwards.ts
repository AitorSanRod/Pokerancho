import { WeeklyBoard } from '../../src/data/rankingPrizes'
import { prizedWeek, rankingPrizeGift } from '../../src/game/core/rankingPrizes'
import { RANKED_USERS } from './users'

// Reparto de los premios semanales de los rankings (tabla ranking_awards, migrations/0016_ranking_awards.sql). Lo
// lanza la tarea programada cada minuto, antes de rehacer las fotos: el primer minuto del lunes reparte la semana que
// acaba de terminar (cada ranking una sola vez) como regalos de server_gifts para cada cuenta que sale en él.

interface Standing {
  user_id: string
  rank: number
}

/** Puestos de la semana `week` en cada ranking: cuentas visibles con algo en esa semana; los empates comparten puesto */
const STANDINGS_SQL: Record<WeeklyBoard, string> = {
  [WeeklyBoard.Damage]: `
    SELECT user_id, RANK() OVER (ORDER BY total DESC) AS rank FROM (
      SELECT boss_damage.user_id, SUM(boss_damage.damage) AS total
      FROM boss_damage JOIN users ON users.id = boss_damage.user_id
      WHERE ${RANKED_USERS} AND boss_damage.week = ?
      GROUP BY boss_damage.user_id
    ) WHERE total > 0`,
  [WeeklyBoard.Tower]: `
    SELECT user_id, RANK() OVER (ORDER BY floor DESC) AS rank FROM (
      SELECT saves.user_id, CAST(json_extract(saves.data, '$.save.towerWeek.best') AS INTEGER) AS floor
      FROM saves JOIN users ON users.id = saves.user_id
      WHERE ${RANKED_USERS} AND json_extract(saves.data, '$.save.towerWeek.week') = ?
    ) WHERE floor > 0`,
}

const awarded = (db: D1Database, board: WeeklyBoard, week: number) =>
  db.prepare('SELECT 1 FROM ranking_awards WHERE board = ? AND week = ?').bind(board, week).first()

/** Reparte un ranking de la semana `week`: un regalo por cuenta y la marca de repartido, todo a la vez */
async function awardBoard(db: D1Database, board: WeeklyBoard, week: number, now: number) {
  const { results } = await db.prepare(STANDINGS_SQL[board]).bind(week).all<Standing>()
  const gifts = results.map((s) => rankingPrizeGift(board, week, s.user_id, s.rank, now))
  await db.batch([
    ...gifts.map((g, i) =>
      db
        .prepare('INSERT OR IGNORE INTO server_gifts (id, title, goods, expires_at, user_id) VALUES (?, ?, ?, ?, ?)')
        .bind(g.id, g.title, JSON.stringify(g.goods), g.expiresAt, results[i].user_id),
    ),
    db.prepare('INSERT OR IGNORE INTO ranking_awards (board, week, awarded_at) VALUES (?, ?, ?)').bind(board, week, now),
  ])
}

/** Desde la tarea programada: reparte los premios de la semana pasada de los rankings que aún no los han dado */
export async function awardWeeklyPrizes(db: D1Database, now: number) {
  const week = prizedWeek(now)
  for (const board of Object.values(WeeklyBoard)) {
    if (!(await awarded(db, board, week))) await awardBoard(db, board, week, now)
  }
}

import type { ScheduledIncursion } from '../../src/game/incursion/schedule/scheduledIncursion'
import { SCHEDULE_TTL_MS } from '../../src/game/incursion/schedule/scheduleRules'

// Incursiones programadas en D1 (tablas incursion_schedules e incursion_schedule_seats, ver
// migrations/0019_incursion_schedules.sql). Se escriben comprobando la versión leída, como los grupos.

/** Incursiones que se leen como mucho para el tablón y para las de un jugador */
const MAX_LISTED = 50

export interface StoredSchedule {
  sched: ScheduledIncursion
  /** null: aún no está guardada */
  version: number | null
}

type Row = { data: string; version: number }
const stored = (row: Row): StoredSchedule => ({ sched: JSON.parse(row.data) as ScheduledIncursion, version: row.version })

export async function loadSchedule(db: D1Database, id: string): Promise<StoredSchedule | null> {
  const row = await db.prepare('SELECT data, version FROM incursion_schedules WHERE id = ?').bind(id).first<Row>()
  return row && stored(row)
}

/** Las que aún no han empezado, de la más cercana a la más lejana */
export async function upcomingSchedules(db: D1Database, now: number): Promise<StoredSchedule[]> {
  const { results } = await db
    .prepare('SELECT data, version FROM incursion_schedules WHERE start_at > ? ORDER BY start_at LIMIT ?')
    .bind(now, MAX_LISTED)
    .all<Row>()
  return results.map(stored)
}

/** Aquellas en las que está el jugador, sin las ya olvidables (más de SCHEDULE_TTL_MS desde su comienzo) */
export async function schedulesOf(db: D1Database, playerId: string, now: number): Promise<StoredSchedule[]> {
  const { results } = await db
    .prepare(
      `SELECT s.data, s.version FROM incursion_schedules s JOIN incursion_schedule_seats p ON p.schedule_id = s.id
       WHERE p.player_id = ? AND s.start_at > ? ORDER BY s.start_at LIMIT ?`,
    )
    .bind(playerId, now - SCHEDULE_TTL_MS, MAX_LISTED)
    .all<Row>()
  return results.map(stored)
}

/** Guarda la incursión (y sus huecos) si nadie la ha cambiado desde que se leyó; false si otro llegó antes */
export async function saveSchedule(db: D1Database, { sched, version }: StoredSchedule): Promise<boolean> {
  const data = JSON.stringify(sched)
  const statement =
    version === null
      ? db.prepare('INSERT INTO incursion_schedules (id, data, version, start_at, updated_at) VALUES (?, ?, 1, ?, ?) ON CONFLICT (id) DO NOTHING').bind(sched.id, data, sched.startAt, sched.updatedAt)
      : db.prepare('UPDATE incursion_schedules SET data = ?, version = version + 1, updated_at = ? WHERE id = ? AND version = ?').bind(data, sched.updatedAt, sched.id, version)
  const { meta } = await statement.run()
  if (meta.changes !== 1) return false
  await db.batch([
    db.prepare('DELETE FROM incursion_schedule_seats WHERE schedule_id = ?').bind(sched.id),
    ...sched.seats.map((s) => db.prepare('INSERT INTO incursion_schedule_seats (schedule_id, player_id) VALUES (?, ?)').bind(sched.id, s.playerId)),
  ])
  return true
}

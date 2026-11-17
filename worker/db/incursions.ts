import { GROUP_TTL_MS } from '../../src/game/incursion/online/protocol'
import type { SharedIncursion } from '../../src/game/incursion/online/sharedIncursion'
import { SCHEDULE_TTL_MS } from '../../src/game/incursion/schedule/scheduleRules'

// Grupos de incursión en D1 (tabla incursion_groups, ver migrations/0010_incursions.sql). Se escriben comprobando la
// versión leída, como las salas de los raids. Los forma una incursión programada a su hora (db/schedules.ts).

export interface StoredGroup {
  group: SharedIncursion
  /** null: aún no está guardado */
  version: number | null
}

export async function loadGroup(db: D1Database, id: string): Promise<StoredGroup | null> {
  const row = await db.prepare('SELECT data, version FROM incursion_groups WHERE id = ?').bind(id).first<{ data: string; version: number }>()
  return row && { group: JSON.parse(row.data) as SharedIncursion, version: row.version }
}

/** Guarda el grupo si nadie lo ha cambiado desde que se leyó (o si es nuevo); false si otro llegó antes */
export async function saveGroup(db: D1Database, { group, version }: StoredGroup): Promise<boolean> {
  const data = JSON.stringify(group)
  const statement =
    version === null
      ? db.prepare('INSERT INTO incursion_groups (id, data, version, updated_at) VALUES (?, ?, 1, ?) ON CONFLICT (id) DO NOTHING').bind(group.id, data, group.updatedAt)
      : db.prepare('UPDATE incursion_groups SET data = ?, version = version + 1, updated_at = ? WHERE id = ? AND version = ?').bind(data, group.updatedAt, group.id, version)
  const { meta } = await statement.run()
  return meta.changes === 1
}

/** Borra los grupos sin consultas en GROUP_TTL_MS y las incursiones programadas pasadas hace SCHEDULE_TTL_MS (tarea programada) */
export async function deleteIdleIncursions(db: D1Database, now: number) {
  await db.prepare('DELETE FROM incursion_groups WHERE updated_at < ?').bind(now - GROUP_TTL_MS).run()
  const old = now - SCHEDULE_TTL_MS
  await db.prepare('DELETE FROM incursion_schedule_seats WHERE schedule_id IN (SELECT id FROM incursion_schedules WHERE start_at < ?)').bind(old).run()
  await db.prepare('DELETE FROM incursion_schedules WHERE start_at < ?').bind(old).run()
}

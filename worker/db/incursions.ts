import type { IncursionId } from '../../src/data/incursions'
import type { MemberState } from '../../src/game/incursion/fighter'
import { GROUP_TTL_MS, QUEUE_STALE_MS } from '../../src/game/incursion/online/protocol'
import type { Queued, SharedIncursion } from '../../src/game/incursion/online/sharedIncursion'

// Cola y grupos de incursión en D1 (tablas incursion_queue e incursion_groups, ver migrations/0010_incursions.sql).
// Los grupos se escriben comprobando la versión leída, como las salas de los raids.

interface QueueRow {
  player_id: string
  nickname: string
  member: string
  joined_at: number
  group_id: string | null
}

const queued = (row: QueueRow): Queued => ({ playerId: row.player_id, nickname: row.nickname, member: JSON.parse(row.member) as MemberState, joinedAt: row.joined_at })

/** El grupo que se le ha formado al jugador mientras esperaba, si lo hay */
export async function formedGroupOf(db: D1Database, playerId: string): Promise<string | null> {
  return db.prepare('SELECT group_id FROM incursion_queue WHERE player_id = ?').bind(playerId).first<string | null>('group_id')
}

/** Lo pone en la cola (o la renueva); si cambia de incursión, vuelve a esperar desde ahora. Devuelve desde cuándo espera */
export async function upsertQueue(db: D1Database, q: Omit<Queued, 'joinedAt'> & { incursionId: IncursionId }, now: number): Promise<number> {
  await db
    .prepare(
      `INSERT INTO incursion_queue (player_id, incursion_id, nickname, member, joined_at, seen_at) VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT (player_id) DO UPDATE SET
         joined_at = CASE WHEN incursion_id = excluded.incursion_id THEN joined_at ELSE excluded.joined_at END,
         incursion_id = excluded.incursion_id, nickname = excluded.nickname, member = excluded.member, seen_at = excluded.seen_at`,
    )
    .bind(q.playerId, q.incursionId, q.nickname, JSON.stringify(q.member), now, now)
    .run()
  return (await db.prepare('SELECT joined_at FROM incursion_queue WHERE player_id = ?').bind(q.playerId).first<number>('joined_at')) ?? now
}

/** Los que esperan esa incursión y siguen consultando, por orden de llegada */
export async function waitingFor(db: D1Database, incursionId: IncursionId, now: number): Promise<Queued[]> {
  const { results } = await db
    .prepare('SELECT * FROM incursion_queue WHERE incursion_id = ? AND group_id IS NULL AND seen_at > ? ORDER BY joined_at')
    .bind(incursionId, now - QUEUE_STALE_MS)
    .all<QueueRow>()
  return results.map(queued)
}

/** Aparta a esos jugadores para el grupo; false si otro grupo se llevó a alguno antes (y no se aparta a nadie) */
export async function claimQueued(db: D1Database, groupId: string, playerIds: string[]): Promise<boolean> {
  const marks = playerIds.map(() => '?').join(', ')
  const { meta } = await db
    .prepare(`UPDATE incursion_queue SET group_id = ? WHERE group_id IS NULL AND player_id IN (${marks})`)
    .bind(groupId, ...playerIds)
    .run()
  if (meta.changes === playerIds.length) return true
  await db.prepare('UPDATE incursion_queue SET group_id = NULL WHERE group_id = ?').bind(groupId).run()
  return false
}

export async function leaveQueue(db: D1Database, playerId: string) {
  await db.prepare('DELETE FROM incursion_queue WHERE player_id = ?').bind(playerId).run()
}

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

/** Borra los grupos sin consultas en GROUP_TTL_MS y las filas de cola abandonadas (tarea programada) */
export async function deleteIdleIncursions(db: D1Database, now: number) {
  await db.prepare('DELETE FROM incursion_groups WHERE updated_at < ?').bind(now - GROUP_TTL_MS).run()
  await db.prepare('DELETE FROM incursion_queue WHERE seen_at < ?').bind(now - GROUP_TTL_MS).run()
}

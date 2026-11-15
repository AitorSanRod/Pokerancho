import { takeDamageTally } from '../../src/game/raid/online/damageTally'
import { channelKey, type RaidRotation } from '../../src/game/raid/online/protocol'
import type { SharedRaid } from '../../src/game/raid/online/sharedRaid'
import { RAID_CYCLE_MS } from '../../src/game/raid/raidSchedule'
import { addDamage } from './damageRanking'

// Las salas de la pestaña Raids en D1 (tabla rooms). Cada escritura comprueba la versión leída: si otro jugador escribió
// la sala entre medias, no se guarda y la petición se repite. Con cada sala se guarda cuántos jugadores tiene, para
// contarlos sin abrir su JSON. Al terminar la pelea, quien la guarda apunta su daño en el ranking (una sola vez: la
// marca va en la misma escritura con versión).

/** Milisegundos reales sin escrituras tras los que se borra una sala: ya se ha jugado su ciclo y el siguiente */
const ROOM_TTL_MS = 2 * RAID_CYCLE_MS

/** Una sala tal y como se leyó; `version` null: aún no está guardada */
export interface StoredRoom {
  room: SharedRaid
  version: number | null
}

interface RoomRow {
  data: string
  version: number
}

const fromRow = (row: RoomRow): StoredRoom => ({ room: JSON.parse(row.data) as SharedRaid, version: row.version })

export async function loadRoom(db: D1Database, roomId: string): Promise<StoredRoom | null> {
  const row = await db.prepare('SELECT data, version FROM rooms WHERE id = ?').bind(roomId).first<RoomRow>()
  return row && fromRow(row)
}

/** Todas las salas de una rotación en un ciclo */
export async function loadChannel(db: D1Database, rotation: RaidRotation, cycle: number): Promise<StoredRoom[]> {
  const { results } = await db.prepare('SELECT data, version FROM rooms WHERE channel = ?').bind(channelKey(rotation, cycle)).all<RoomRow>()
  return results.map(fromRow)
}

/** Salas y jugadores de una rotación en un ciclo, sin abrir sus salas */
export async function countChannel(db: D1Database, rotation: RaidRotation, cycle: number): Promise<{ rooms: number; players: number }> {
  const row = await db
    .prepare('SELECT COUNT(*) AS rooms, COALESCE(SUM(players), 0) AS players FROM rooms WHERE channel = ? AND players > 0')
    .bind(channelKey(rotation, cycle))
    .first<{ rooms: number; players: number }>()
  return { rooms: row?.rooms ?? 0, players: row?.players ?? 0 }
}

/** Guarda la sala si nadie la ha cambiado desde que se leyó (o si es nueva); false si otro llegó antes */
export async function saveRoom(db: D1Database, { room, version }: StoredRoom, now: number): Promise<boolean> {
  const tally = takeDamageTally(room, now)
  const data = JSON.stringify(room)
  const players = room.entrants.length
  const statement =
    version === null
      ? db
          .prepare('INSERT INTO rooms (id, channel, data, version, updated_at, players) VALUES (?, ?, ?, 1, ?, ?) ON CONFLICT (id) DO NOTHING')
          .bind(room.id, channelKey(room.rotation, room.cycle), data, room.updatedAt, players)
      : db
          .prepare('UPDATE rooms SET data = ?, version = version + 1, updated_at = ?, players = ? WHERE id = ? AND version = ?')
          .bind(data, room.updatedAt, players, room.id, version)
  const { meta } = await statement.run()
  if (meta.changes !== 1) return false
  await addDamage(db, tally, now)
  return true
}

/** Borra las salas que nadie ha tocado en ROOM_TTL_MS (tarea programada) */
export async function deleteOldRooms(db: D1Database, now: number) {
  await db.prepare('DELETE FROM rooms WHERE updated_at < ?').bind(now - ROOM_TTL_MS).run()
}

import { withEvolutionLines, type CloudSave } from '../../src/game/core/cloudSave'

// Partidas en la nube en D1 (tabla saves): una por cuenta. Subir solo vale encima de la revisión que el dispositivo
// vio por última vez, con un sello de intercambios que no sea más viejo que el de la nube (ver trade/tradeOps.ts) y desde
// una versión de la app que no sea más vieja que la de la partida de la nube (una app sin actualizar no sabe leerla
// entera); la comprobación va en la misma consulta, así dos subidas a la vez no se pisan. De cada cuenta se guardan
// copias de las últimas partidas (save_history) por si hay que recuperar algo a mano.

interface SaveRow {
  data: string
}

export async function loadSave(db: D1Database, userId: string): Promise<CloudSave | null> {
  const row = await db.prepare('SELECT data FROM saves WHERE user_id = ?').bind(userId).first<SaveRow>()
  return row && withEvolutionLines(JSON.parse(row.data) as CloudSave)
}

/** El sello de intercambios de una partida subida (las de antes de los intercambios no lo tienen: 0) */
export const tradeStampOf = (cloud: CloudSave): number => (Number.isInteger(cloud.save.tradeStamp) ? cloud.save.tradeStamp : 0)

/** Versión de la app con la que se guardó la partida de la nube (0 si no se sabe) */
export const saveVersionOf = (cloud: CloudSave): number => (Number.isInteger(cloud.save.version) ? cloud.save.version : 0)

/** Milisegundos como mínimo entre dos copias de la partida de una cuenta en save_history */
export const HISTORY_EVERY_MS = 60 * 60_000
/** Milisegundos que se guarda cada copia de save_history */
export const HISTORY_KEEP_MS = 3 * 24 * 60 * 60_000

/** Antes de cambiar la partida de la nube, copia de la que había (si la última copia tiene más de HISTORY_EVERY_MS) y fuera las viejas */
function historyStatements(db: D1Database, userId: string, now: number): D1PreparedStatement[] {
  return [
    db
      .prepare(
        `INSERT OR IGNORE INTO save_history (user_id, saved_at, revision, data)
         SELECT user_id, updated_at, revision, data FROM saves
         WHERE user_id = ? AND NOT EXISTS (SELECT 1 FROM save_history WHERE user_id = ? AND saved_at > ?)`,
      )
      .bind(userId, userId, now - HISTORY_EVERY_MS),
    db.prepare('DELETE FROM save_history WHERE user_id = ? AND saved_at < ?').bind(userId, now - HISTORY_KEEP_MS),
  ]
}

/**
 * Guarda `cloud` si en la nube sigue la revisión `base` (null: no había ninguna), su sello de intercambios no es más
 * nuevo que el de la subida y no se guardó con una versión de la app más nueva; false si no (otro dispositivo subió
 * antes, es una partida de antes de un intercambio o la app de este dispositivo está sin actualizar)
 */
export async function writeSave(db: D1Database, userId: string, cloud: CloudSave, base: number | null): Promise<boolean> {
  const data = JSON.stringify(cloud)
  const stamp = tradeStampOf(cloud)
  if (base === null) {
    const insert = db
      .prepare('INSERT INTO saves (user_id, data, revision, updated_at, trade_stamp) VALUES (?, ?, ?, ?, ?) ON CONFLICT (user_id) DO NOTHING')
      .bind(userId, data, cloud.revision, cloud.updatedAt, stamp)
    return (await insert.run()).meta.changes === 1
  }
  const update = db
    .prepare(
      `UPDATE saves SET data = ?, revision = ?, updated_at = ?, trade_stamp = ?
       WHERE user_id = ? AND revision = ? AND trade_stamp <= ? AND COALESCE(json_extract(data, '$.save.version'), 0) <= ?`,
    )
    .bind(data, cloud.revision, cloud.updatedAt, stamp, userId, base, stamp, saveVersionOf(cloud))
  const results = await db.batch([...historyStatements(db, userId, cloud.updatedAt), update])
  return results.at(-1)!.meta.changes === 1
}

/**
 * Guarda la partida cambiada por un intercambio, solo si en la nube sigue la revisión anterior y además se cumple
 * `guard` (una condición SQL sobre las otras tablas, con sus valores): va en el mismo lote que el anuncio
 */
export function tradeSaveStatement(db: D1Database, userId: string, cloud: CloudSave, guard: string, guardValues: (string | number)[]): D1PreparedStatement {
  return db
    .prepare(`UPDATE saves SET data = ?, revision = ?, updated_at = ?, trade_stamp = ? WHERE user_id = ? AND revision = ? AND ${guard}`)
    .bind(JSON.stringify(cloud), cloud.revision, cloud.updatedAt, tradeStampOf(cloud), userId, cloud.revision - 1, ...guardValues)
}

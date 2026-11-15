import { deleteOldRooms } from './db/rooms'
import { deleteIdleIncursions } from './db/incursions'
import { pruneMailLog } from './db/mailLog'
import { expireListings } from './db/trades'
import type { Env } from './env'
import { sendDuePushes } from './push/send'
import { awardWeeklyPrizes } from './db/rankingAwards'
import { refreshRanking } from './ranking'

// La tarea programada (cron, cada minuto; ver wrangler.jsonc): borra las salas de raid de ciclos ya jugados, devuelve a
// su dueño los anuncios de intercambio caducados, borra los grupos de incursión abandonados y los apuntes viejos de
// correos mandados, reparte los premios semanales de los rankings el lunes, rehace el ranking cada hora y manda los
// avisos push que ya tocan. Las raids no hace falta ponerlas al día: van por calendario y cada consulta cierra lo pasado.

export async function scheduled(env: Env) {
  const now = Date.now()
  await deleteOldRooms(env.DB, now).catch((e: unknown) => console.error('Raids: no se han podido borrar las salas viejas', e))
  await deleteIdleIncursions(env.DB, now).catch((e: unknown) => console.error('Incursiones: no se han podido borrar los grupos viejos', e))
  await expireListings(env.DB, now).catch((e: unknown) => console.error('Intercambios: no se han podido caducar los anuncios', e))
  await awardWeeklyPrizes(env.DB, now).catch((e: unknown) => console.error('Ranking: no se han podido repartir los premios', e))
  await refreshRanking(env.DB, now).catch((e: unknown) => console.error('Ranking: no se ha podido rehacer', e))
  await pruneMailLog(env.DB, now).catch((e: unknown) => console.error('Correos: no se ha podido limpiar el registro', e))
  await sendDuePushes(env, now)
}

import { parseServerGifts } from '../src/game/collection/serverGifts'
import { sessionUser } from './auth/session'
import type { Env } from './env'
import { json } from './http'

// GET /api/server-gifts: los regalos del servidor que siguen en vigor (tabla server_gifts, ver
// migrations/0011_server_gifts.sql y 0013_save_safety.sql). Los de todos se dan sin cuenta; los de un jugador, solo con
// su sesión. La partida apunta cuáles ha recogido ya.

interface GiftRow {
  id: string
  title: string
  goods: string
}

export async function serverGiftsRoute(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'GET') return json({ error: 'Solo GET' }, 405)
  const now = Date.now()
  const user = await sessionUser(env.DB, request, now)
  const { results } = await env.DB.prepare('SELECT id, title, goods FROM server_gifts WHERE expires_at > ? AND (user_id IS NULL OR user_id = ?) ORDER BY id')
    .bind(now, user?.id ?? null)
    .all<GiftRow>()
  const gifts = parseServerGifts(results.map((row) => ({ id: row.id, title: row.title, ...(JSON.parse(row.goods) as object) })))
  return json({ gifts })
}

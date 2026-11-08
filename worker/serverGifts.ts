import { parseServerGifts } from '../src/game/collection/serverGifts'
import type { Env } from './env'
import { json } from './http'

// GET /api/server-gifts: los regalos del servidor que siguen en vigor (tabla server_gifts, ver
// migrations/0011_server_gifts.sql). Son para todos y sin cuenta: la partida apunta cuáles ha recogido ya.

interface GiftRow {
  id: string
  title: string
  goods: string
}

export async function serverGiftsRoute(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'GET') return json({ error: 'Solo GET' }, 405)
  const { results } = await env.DB.prepare('SELECT id, title, goods FROM server_gifts WHERE expires_at > ? ORDER BY id')
    .bind(Date.now())
    .all<GiftRow>()
  const gifts = parseServerGifts(results.map((row) => ({ id: row.id, title: row.title, ...(JSON.parse(row.goods) as object) })))
  return json({ gifts })
}

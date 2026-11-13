import { describe, expect, it, vi } from 'vitest'
import { INCURSIONS } from '../src/data/incursions'
import { SPECIES } from '../src/data/species'
import { accountId, player } from './test/accounts'
import { testWorker } from './test/api'

vi.mock('./mail', async (original) => ({ ...(await original<typeof import('./mail')>()), sendMail: vi.fn() }))

const ID = INCURSIONS[0].id
const SPECIES_ID = SPECIES[0].id

async function addGift(db: D1Database, id: string, expiresAt: number, userId: string | null = null) {
  await db
    .prepare('INSERT INTO server_gifts (id, title, goods, expires_at, user_id) VALUES (?, ?, ?, ?, ?)')
    .bind(id, 'Regalo', JSON.stringify({ money: 500, incursionKeys: { [ID]: 1 }, mons: [{ speciesId: SPECIES_ID, level: 10, stars: 1 }] }), expiresAt, userId)
    .run()
}

describe('regalos del servidor', () => {
  it('da los que siguen en vigor, con buena forma; los caducados, no', async () => {
    const api = testWorker()
    await api.env.DB.prepare('DELETE FROM server_gifts').run()
    await addGift(api.env.DB, 'vigente', Date.now() + 60_000)
    await addGift(api.env.DB, 'caducado', Date.now() - 1)
    const { status, data } = await api.call('/api/server-gifts')
    expect(status).toBe(200)
    expect(data.gifts).toEqual([{ id: 'vigente', title: 'Regalo', money: 500, missingnoShards: 0, tickets: 0, starItems: {}, incursionKeys: { [ID]: 1 }, mons: [{ speciesId: SPECIES_ID, level: 10, exp: 0, stars: 1 }] }])
  })

  it('el regalo de un jugador solo lo ve él, con su sesión', async () => {
    const misty = await player('misty@celeste.es', null)
    const brock = await player('brock@plateada.es', null, misty.env)
    await misty.env.DB.prepare('DELETE FROM server_gifts').run()
    await addGift(misty.env.DB, 'para-misty', Date.now() + 60_000, await accountId(misty))
    const ids = async (api: typeof misty) => (await api.call('/api/server-gifts')).data.gifts.map((g: { id: string }) => g.id)
    expect(await ids(misty)).toEqual(['para-misty'])
    expect(await ids(brock)).toEqual([])
    expect(await ids(testWorker(misty.env))).toEqual([])
  })
})

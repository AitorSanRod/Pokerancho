import { describe, expect, it } from 'vitest'
import { INCURSIONS } from '../src/data/incursions'
import { testWorker } from './test/api'

const ID = INCURSIONS[0].id

describe('regalos del servidor', () => {
  it('da los que siguen en vigor, con buena forma; los caducados, no', async () => {
    const api = testWorker()
    await api.env.DB.prepare('DELETE FROM server_gifts').run()
    const add = (id: string, expiresAt: number) =>
      api.env.DB.prepare('INSERT INTO server_gifts (id, title, goods, expires_at) VALUES (?, ?, ?, ?)')
        .bind(id, 'Regalo', JSON.stringify({ incursionKeys: { [ID]: 1 } }), expiresAt)
        .run()
    await add('vigente', Date.now() + 60_000)
    await add('caducado', Date.now() - 1)
    const { status, data } = await api.call('/api/server-gifts')
    expect(status).toBe(200)
    expect(data.gifts).toEqual([{ id: 'vigente', title: 'Regalo', incursionKeys: { [ID]: 1 } }])
  })
})

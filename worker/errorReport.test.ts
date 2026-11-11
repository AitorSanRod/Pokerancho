import { describe, expect, it } from 'vitest'
import { testWorker } from './test/api'

interface Row {
  message: string
  count: number
  active: number
  user_id: string | null
}

const rows = (db: D1Database) => db.prepare('SELECT message, count, active, user_id FROM error_reports ORDER BY id').all<Row>().then((r) => r.results)

const REPORT = { message: 'undefined is not an object', stack: 'at roomPace', component: 'at RunView' }

describe('errores enviados por los jugadores', () => {
  it('guarda el error activo y, si se repite, suma en la misma fila', async () => {
    const api = testWorker()
    expect((await api.call('/api/error-report', { body: REPORT })).status).toBe(200)
    await api.call('/api/error-report', { body: REPORT })
    await api.call('/api/error-report', { body: { ...REPORT, message: 'otro' } })
    expect(await rows(api.env.DB)).toEqual([
      { message: REPORT.message, count: 2, active: 1, user_id: null },
      { message: 'otro', count: 1, active: 1, user_id: null },
    ])
  })

  it('un error marcado como corregido que vuelve a pasar entra como fila nueva', async () => {
    const api = testWorker()
    await api.call('/api/error-report', { body: REPORT })
    await api.env.DB.prepare('UPDATE error_reports SET active = 0').run()
    await api.call('/api/error-report', { body: REPORT })
    expect((await rows(api.env.DB)).map((r) => [r.count, r.active])).toEqual([
      [1, 0],
      [1, 1],
    ])
  })

  it('rechaza informes vacíos, desde otra web o sin POST', async () => {
    const api = testWorker()
    expect((await api.call('/api/error-report', { body: { message: '' } })).status).toBe(400)
    expect((await api.call('/api/error-report', { body: REPORT, origin: 'https://otra.web' })).status).toBe(403)
    expect((await api.call('/api/error-report')).status).toBe(405)
    expect(await rows(api.env.DB)).toEqual([])
  })
})

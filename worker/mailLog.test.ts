import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthCode } from '../src/game/core/accountRules'
import { logMail, MAIL_DAILY_CAP, MAIL_PER_IP_PER_HOUR, mailAllowed, pruneMailLog } from './db/mailLog'
import { sendMail } from './mail'
import { fakeD1 } from './test/fakeD1'
import { testWorker } from './test/api'

vi.mock('./mail', async (original) => ({ ...(await original<typeof import('./mail')>()), sendMail: vi.fn() }))

const NOW = Date.UTC(2026, 0, 1)
const HOUR_MS = 60 * 60 * 1000

beforeEach(() => vi.mocked(sendMail).mockClear())

describe('cupo de correos', () => {
  it('una misma IP no manda más de su cupo por hora; pasada la hora, vuelve a poder', async () => {
    const db = fakeD1()
    for (let i = 0; i < MAIL_PER_IP_PER_HOUR; i++) await logMail(db, '1.2.3.4', NOW)
    expect(await mailAllowed(db, '1.2.3.4', NOW)).toBe(false)
    expect(await mailAllowed(db, '5.6.7.8', NOW)).toBe(true)
    expect(await mailAllowed(db, '1.2.3.4', NOW + HOUR_MS + 1)).toBe(true)
  })

  it('con el cupo del día gastado no se crea la cuenta ni se manda nada; al limpiar lo viejo, vuelve a poder', async () => {
    const api = testWorker()
    for (let i = 0; i < MAIL_DAILY_CAP; i++) await logMail(api.env.DB, `ip${i}`, Date.now())
    const res = await api.call('/api/auth/signup', { body: { email: 'misty@celeste.es', password: 'staryu123' } })
    expect(res.data.code).toBe(AuthCode.TooManyMails)
    expect(sendMail).not.toHaveBeenCalled()
    await pruneMailLog(api.env.DB, Date.now() + 25 * HOUR_MS)
    expect(await mailAllowed(api.env.DB, '', Date.now())).toBe(true)
  })
})

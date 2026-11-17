import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { IncursionAction } from '../src/game/incursion/online/protocol'
import { PARTY_SIZE } from '../src/game/incursion/party'
import { testWorker } from './test/api'
import { NOW, startedGroup, who } from './test/schedules'

vi.mock('../src/data/incursions', () => import('../src/game/incursion/incursion-test-mock'))

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(NOW)
})
afterEach(() => {
  vi.useRealTimers()
})

describe('incursiones con otros jugadores', () => {
  it('a la hora de una incursión programada, el grupo se completa con bots', async () => {
    const group = await startedGroup(testWorker())
    expect(group.members).toHaveLength(PARTY_SIZE)
    expect(group.you).toBe('mon0')
  })

  it('el grupo vota retirarse; quien no está en él no lo ve', async () => {
    const api = testWorker()
    const { groupId } = await startedGroup(api)
    const voted = await api.call('/api/incursion', { body: { action: IncursionAction.Vote, ...who(0), groupId, retreat: true } })
    expect(voted.data.group.retreat).not.toBeNull()
    const stranger = await api.call('/api/incursion', { body: { action: IncursionAction.Sync, ...who(9), groupId } })
    expect(stranger.data.gone).toBe(true)
  })

  it('acepta el aviso de toques de un jugador del grupo', async () => {
    const api = testWorker()
    const { groupId } = await startedGroup(api)
    const tapped = await api.call('/api/incursion', { body: { action: IncursionAction.Tap, ...who(0), groupId, leg: 0, turn: 0 } })
    expect(tapped.status).toBe(200)
    expect(tapped.data.group.groupId).toBe(groupId)
    expect((await api.call('/api/incursion', { body: { action: IncursionAction.Tap, ...who(0), groupId, leg: -1, turn: 0 } })).status).toBe(400)
  })

  it('la cola ya no existe: una app sin actualizar recibe un error', async () => {
    expect((await testWorker().call('/api/incursion', { body: { action: 'queue', ...who(0) } })).status).toBe(400)
  })
})

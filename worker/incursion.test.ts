import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { POKEMON } from '../src/data/pokemon'
import { TEST_INCURSION } from '../src/game/incursion/incursion-test-mock'
import { IncursionAction, QUEUE_MAX_MS } from '../src/game/incursion/online/protocol'
import { freshMember, PARTY_SIZE } from '../src/game/incursion/party'
import { repertoire } from '../src/game/incursion/repertoire'
import { testWorker } from './test/api'

vi.mock('../src/data/incursions', () => import('../src/game/incursion/incursion-test-mock'))

const LEVEL = 20
const MOVE = repertoire(POKEMON.Snorlax, LEVEL)[0].id
const NOW = 1_700_000_000_000

const who = (n: number) => ({ playerId: `jugador-${n}`, nickname: `J${n}` })
const queue = (n: number) => ({
  action: IncursionAction.Queue,
  ...who(n),
  incursionId: TEST_INCURSION.id,
  member: freshMember({ id: `mon${n}`, speciesId: POKEMON.Snorlax, level: LEVEL, stars: 0, moveId: MOVE }),
})

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(NOW)
})
afterEach(() => {
  vi.useRealTimers()
})

describe('incursiones con otros jugadores', () => {
  it('cinco en la cola forman grupo; cada uno lo recoge en su siguiente consulta', async () => {
    const api = testWorker()
    for (let n = 0; n < PARTY_SIZE - 1; n++) expect((await api.call('/api/incursion', { body: queue(n) })).data.queue.waiting).toBe(n + 1)
    const last = await api.call('/api/incursion', { body: queue(PARTY_SIZE - 1) })
    expect(last.data.group.nicknames).toHaveProperty('mon4', 'J4')
    const first = await api.call('/api/incursion', { body: queue(0) })
    expect(first.data.group.groupId).toBe(last.data.group.groupId)
    expect(first.data.group.you).toBe('mon0')
  })

  it('solo en la cola, al minuto el grupo se completa con bots', async () => {
    const api = testWorker()
    expect((await api.call('/api/incursion', { body: queue(0) })).data.queue).toBeDefined()
    vi.setSystemTime(NOW + QUEUE_MAX_MS / 2)
    expect((await api.call('/api/incursion', { body: queue(0) })).data.queue).toBeDefined()
    vi.setSystemTime(NOW + QUEUE_MAX_MS)
    const { data } = await api.call('/api/incursion', { body: queue(0) })
    expect(data.group.members).toHaveLength(PARTY_SIZE)
  })

  it('el grupo vota retirarse y se puede salir de la cola sin entrar', async () => {
    const api = testWorker()
    await api.call('/api/incursion', { body: queue(0) })
    vi.setSystemTime(NOW + QUEUE_MAX_MS)
    const { groupId } = (await api.call('/api/incursion', { body: queue(0) })).data.group
    const voted = await api.call('/api/incursion', { body: { action: IncursionAction.Vote, ...who(0), groupId, retreat: true } })
    expect(voted.data.group.retreat).not.toBeNull()
    const stranger = await api.call('/api/incursion', { body: { action: IncursionAction.Sync, ...who(9), groupId } })
    expect(stranger.data.gone).toBe(true)
    await api.call('/api/incursion', { body: queue(1) })
    expect((await api.call('/api/incursion', { body: { action: IncursionAction.Leave, ...who(1) } })).data.gone).toBe(true)
  })

  it('rechaza peticiones mal hechas', async () => {
    expect((await testWorker().call('/api/incursion', { body: { action: 'queue' } })).status).toBe(400)
  })
})

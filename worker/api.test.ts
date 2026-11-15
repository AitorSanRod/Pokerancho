import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { STARTERS } from '../src/data/species'
import { cloudUpload, SaveRejection } from '../src/game/core/cloudSave'
import { initialState, SAVE_VERSION } from '../src/game/core/state'
import { chooseStarter } from '../src/game/core/test-utils'
import { RaidAction, RaidRotation } from '../src/game/raid/online/protocol'
import { entrant } from '../src/game/raid/raid-test-utils'
import { cycleEnd, fightStart, lobbyStart } from '../src/game/raid/raidSchedule'
import { deleteOldRooms } from './db/rooms'
import { MailKind, sendMail } from './mail'
import { testWorker } from './test/api'

vi.mock('./mail', async (original) => ({ ...(await original<typeof import('./mail')>()), sendMail: vi.fn() }))
vi.mock('../src/data/maps/kantoMaps', () => import('../src/game/core/test-map'))

async function signedIn() {
  const api = testWorker()
  await api.call('/api/auth/signup', { body: { email: 'misty@celeste.es', password: 'staryu1234' } })
  const token = vi.mocked(sendMail).mock.calls.filter((c) => c[2] === MailKind.Confirm).at(-1)![3].split('=')[1]
  await api.call('/api/auth/confirm', { body: { token } })
  return api
}

function upload(money: number, baseRevision: number | null) {
  const s = initialState()
  chooseStarter(s, STARTERS[0])
  s.money = money
  return { baseRevision, ...cloudUpload(s) }
}

describe('partida en la nube', () => {
  it('sin sesión no hay partida', async () => {
    expect((await testWorker().call('/api/save')).status).toBe(401)
  })

  it('se sube encima de la última revisión; encima de una vieja, 409 con la de la nube', async () => {
    const api = await signedIn()
    expect((await api.call('/api/save')).data.cloud).toBeNull()
    expect((await api.call('/api/save', { body: upload(100, null) })).data.revision).toBe(1)
    expect((await api.call('/api/save', { body: upload(200, 1) })).data.revision).toBe(2)
    const stale = await api.call('/api/save', { body: upload(300, 1) })
    expect(stale.status).toBe(409)
    expect(stale.data.cloud).toMatchObject({ revision: 2, save: { money: 200 } })
    expect((await api.call('/api/save', { body: upload(300, null) })).status).toBe(409)
  })

  it('una app sin actualizar no pisa una partida guardada con una versión más nueva: 409 diciendo por qué, sin la partida', async () => {
    const api = await signedIn()
    const newer = upload(100, null)
    newer.save.version = SAVE_VERSION + 1
    await api.call('/api/save', { body: newer })
    const outdated = await api.call('/api/save', { body: upload(200, 1) })
    expect(outdated).toMatchObject({ status: 409, data: { cloud: null, code: SaveRejection.OutdatedApp } })
    expect((await api.call('/api/save')).data.cloud).toMatchObject({ revision: 1, save: { money: 100 } })
  })

  it('antes de cambiar la partida se guarda una copia de la que había, como mucho una cada hora', async () => {
    const api = await signedIn()
    for (const [money, base] of [[100, null], [200, 1], [300, 2]] as const) await api.call('/api/save', { body: upload(money, base) })
    const { results } = await api.env.DB.prepare('SELECT revision FROM save_history').all<{ revision: number }>()
    expect(results).toEqual([{ revision: 1 }])
  })
})

describe('salas de la pestaña Raids', () => {
  const CYCLE = 1000
  const member = (id: string) => entrant(id, 60).member
  const join = (playerId: string, id: string, rotation: RaidRotation = RaidRotation.Ordered) => ({ action: RaidAction.Join, playerId, nickname: playerId, rotation, member: member(id) })
  const inRoom = (action: string, playerId: string, roomId: string, extra: object = {}) => ({ action, playerId, nickname: playerId, roomId, ...extra })

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(lobbyStart(CYCLE) + 1000)
  })
  afterEach(() => vi.useRealTimers())

  it('dos jugadores que entran contra el mismo jefe acaban en la misma sala, y la pestaña los cuenta', async () => {
    const api = testWorker()
    const a = (await api.call('/api/raid', { body: join('player-aaaa', 'a1') })).data.room
    const b = (await api.call('/api/raid', { body: join('player-bbbb', 'b1') })).data.room
    expect(b.room.id).toBe(a.room.id)
    expect(b.room.entrants.map((e: { trainer: string }) => e.trainer)).toEqual(['player-aaaa', 'player-bbbb'])
    const { board } = (await api.call('/api/raid', { body: { action: RaidAction.Board, playerId: 'player-cccc', nickname: 'C' } })).data
    expect(board.rotations.find((r: { rotation: string }) => r.rotation === RaidRotation.Ordered)).toMatchObject({ cycle: CYCLE, players: 2, rooms: 1 })
  })

  it('cada rotación tiene sus salas', async () => {
    const api = testWorker()
    const a = (await api.call('/api/raid', { body: join('player-aaaa', 'a1', RaidRotation.Ordered) })).data.room
    const b = (await api.call('/api/raid', { body: join('player-bbbb', 'b1', RaidRotation.Hard) })).data.room
    expect(b.room.id).not.toBe(a.room.id)
  })

  it('con la pelea empezada ya no se entra; quien estaba, la ve empezar', async () => {
    const api = testWorker()
    const a = (await api.call('/api/raid', { body: join('player-aaaa', 'a1') })).data.room
    vi.setSystemTime(fightStart(CYCLE))
    expect((await api.call('/api/raid', { body: join('player-bbbb', 'b1') })).data).toEqual({ gone: true })
    const seen = (await api.call('/api/raid', { body: inRoom(RaidAction.Sync, 'player-aaaa', a.room.id) })).data.room
    expect(seen.room.fight.members[0].id).toBe('a1')
  })

  it('al salir de la sala abierta ya no está en ella', async () => {
    const api = testWorker()
    const a = (await api.call('/api/raid', { body: join('player-aaaa', 'a1') })).data.room
    expect((await api.call('/api/raid', { body: inRoom(RaidAction.Leave, 'player-aaaa', a.room.id) })).data).toEqual({ gone: true })
    expect((await api.call('/api/raid', { body: inRoom(RaidAction.Sync, 'player-aaaa', a.room.id) })).data).toEqual({ gone: true })
  })

  it('la tarea programada borra las salas de ciclos ya jugados', async () => {
    const api = testWorker()
    const a = (await api.call('/api/raid', { body: join('player-aaaa', 'a1') })).data.room
    await deleteOldRooms(api.env.DB, cycleEnd(CYCLE + 2))
    expect(await api.env.DB.prepare('SELECT id FROM rooms WHERE id = ?').bind(a.room.id).first()).toBeNull()
  })

  it('una petición mal formada se rechaza', async () => {
    expect((await testWorker().call('/api/raid', { body: { action: 'join' } })).status).toBe(400)
  })
})

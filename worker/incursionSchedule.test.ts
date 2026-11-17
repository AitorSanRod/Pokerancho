import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PARTY_SIZE } from '../src/game/incursion/party'
import { ScheduleRefusal } from '../src/game/incursion/schedule/scheduledIncursion'
import { ScheduleAction } from '../src/game/incursion/schedule/scheduleProtocol'
import { checkInOpensAt, ScheduleCancel, SLOT_MS } from '../src/game/incursion/schedule/scheduleRules'
import { testWorker } from './test/api'
import { call, checkIn, create, NOW, START, who } from './test/schedules'

vi.mock('../src/data/incursions', () => import('../src/game/incursion/incursion-test-mock'))

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(NOW)
})
afterEach(() => {
  vi.useRealTimers()
})

const join = (api: ReturnType<typeof testWorker>, scheduleId: string, n: number) => call(api, { action: ScheduleAction.Join, ...who(n), scheduleId, bond: 50 })

describe('incursiones programadas en el servidor', () => {
  it('se crea con el creador dentro y sale en el tablón de los demás', async () => {
    const api = testWorker()
    const { schedule } = (await create(api)).data
    expect(schedule.you).toMatchObject({ bond: 100 })
    const board = (await call(api, { action: ScheduleAction.Board, ...who(1) })).data.board
    expect(board.open.map((v: { id: string }) => v.id)).toEqual([schedule.id])
    expect(board.mine).toEqual([])
  })

  it('una franja que no vale se rechaza', async () => {
    expect((await create(testWorker(), 0, 100, START + 1)).data.refused).toBe(ScheduleRefusal.BadSlot)
  })

  it('se llena por orden y después ya no entra nadie', async () => {
    const api = testWorker()
    const id = (await create(api)).data.schedule.id
    for (let n = 1; n < PARTY_SIZE; n++) expect((await join(api, id, n)).data.schedule.seats).toHaveLength(n + 1)
    expect((await join(api, id, PARTY_SIZE)).data.refused).toBe(ScheduleRefusal.Full)
    expect((await call(api, { action: ScheduleAction.Board, ...who(1) })).data.board.mine).toHaveLength(1)
  })

  it('no se pueden tener dos que empiecen demasiado cerca', async () => {
    const api = testWorker()
    await create(api)
    expect((await create(api, 0, 100, START + SLOT_MS)).data.refused).toBe(ScheduleRefusal.Overlap)
  })

  it('baja y cancelación', async () => {
    const api = testWorker()
    const id = (await create(api)).data.schedule.id
    await join(api, id, 1)
    expect((await call(api, { action: ScheduleAction.Leave, ...who(1), scheduleId: id })).data.schedule.you).toBeNull()
    expect((await call(api, { action: ScheduleAction.Cancel, ...who(1), scheduleId: id })).data.refused).toBe(ScheduleRefusal.NotCreator)
    expect((await call(api, { action: ScheduleAction.Cancel, ...who(0), scheduleId: id })).data.schedule.cancelledBy).toBe(ScheduleCancel.Creator)
  })

  it('el checkin fuera de la sala se rechaza', async () => {
    const api = testWorker()
    const id = (await create(api)).data.schedule.id
    expect((await call(api, { action: ScheduleAction.CheckIn, ...who(0), scheduleId: id })).data.refused).toBe(ScheduleRefusal.WrongPhase)
    vi.setSystemTime(checkInOpensAt(START))
    expect((await call(api, { action: ScheduleAction.CheckIn, ...who(0), scheduleId: id })).data.schedule.you.checkedIn).toBe(true)
  })

  it('a la hora, el grupo se forma una sola vez aunque pregunten dos y la fianza del ausente se reparte', async () => {
    const api = testWorker()
    const id = (await create(api)).data.schedule.id
    await join(api, id, 1)
    await checkIn(api, id, 0)
    vi.setSystemTime(START + 1000)
    const first = (await call(api, { action: ScheduleAction.Sync, ...who(0), scheduleId: id })).data
    const second = (await call(api, { action: ScheduleAction.Sync, ...who(0), scheduleId: id })).data
    expect(first.group.groupId).toBe(second.group.groupId)
    expect(first.schedule.shares).toBe(50)
    const absent = (await call(api, { action: ScheduleAction.Sync, ...who(1), scheduleId: id })).data
    expect(absent.group).toBeUndefined()
    expect(absent.schedule.shares).toBe(0)
  })

  it('si nadie marca Pokémon, a la hora se cancela', async () => {
    const api = testWorker()
    const id = (await create(api)).data.schedule.id
    vi.setSystemTime(START)
    const mine = (await call(api, { action: ScheduleAction.Board, ...who(0) })).data.board.mine
    expect(mine[0].cancelledBy).toBe(ScheduleCancel.Nobody)
    expect((await call(api, { action: ScheduleAction.Sync, ...who(0), scheduleId: id })).data.schedule.cancelledBy).toBe(ScheduleCancel.Nobody)
  })

  it('una que no existe se da por perdida', async () => {
    expect((await call(testWorker(), { action: ScheduleAction.Sync, ...who(0), scheduleId: 'abcdef12' })).data.gone).toBe(true)
  })
})

import { describe, expect, it, vi } from 'vitest'
import { INCURSIONS } from '../../data/incursions'
import { KANTO } from '../../data/maps'
import { CHECKIN_OPEN_MS, SchedulePhase } from '../incursion/schedule/scheduleRules'
import type { ScheduleView } from '../incursion/schedule/scheduleView'
import { RAID_ROTATIONS } from '../raid/online/protocol'
import { newRoom } from '../raid/raidRoom'
import type { TabRaid } from '../raid/raid'
import { fightStart, lobbyStart } from '../raid/raidSchedule'
import { ActivityKind, activities } from './activity'
import { initialState, type GameState } from './state'
import { testExpedition } from './test-utils'

vi.mock('../../data/maps/kantoMaps', () => import('./test-map'))

const INCURSION = INCURSIONS[0].id
/** Un instante en plena pelea de raid: sin la sala abierta, para que no salga en las listas que no la miran */
const FIGHT_NOW = fightStart(3)

function played(): GameState {
  const s = initialState()
  s.tutorial = null
  return s
}

const kinds = (s: GameState, now = FIGHT_NOW, board: ScheduleView[] | null = null) => activities(s, now, board).map((a) => a.kind)

const view = (fields: Partial<ScheduleView>): ScheduleView => ({ phase: SchedulePhase.Open, you: null, ...fields }) as ScheduleView

describe('actividades en curso', () => {
  it('sin nada en marcha, no hay ninguna', () => {
    expect(kinds(played())).toEqual([])
  })

  it('enseña la próxima programada y cuántas hay; pide mirarla al abrirse el checkin', () => {
    const s = played()
    const now = FIGHT_NOW
    const soon = now + CHECKIN_OPEN_MS * 2
    s.incursionBonds = [
      { scheduleId: 'late', incursionId: INCURSION, startAt: soon * 2, amount: 0, refunded: false },
      { scheduleId: 'soon', incursionId: INCURSION, startAt: soon, amount: 0, refunded: false },
    ]
    expect(activities(s, now, null)).toEqual([{ kind: ActivityKind.Scheduled, incursionId: INCURSION, startAt: soon, count: 2, ready: false }])
    expect(activities(s, soon - CHECKIN_OPEN_MS, null)[0].ready).toBe(true)
  })

  it('la del checkin abierto va aparte y no cuenta como programada', () => {
    const s = played()
    const startAt = FIGHT_NOW + CHECKIN_OPEN_MS / 2
    s.incursionBonds = [{ scheduleId: 'x', incursionId: INCURSION, startAt, amount: 0, refunded: false }]
    s.incursionCheckin = { scheduleId: 'x', incursionId: INCURSION, startAt, uid: null, moveId: null, locked: false }
    expect(kinds(s)).toEqual([ActivityKind.Checkin])
  })

  it('con la sala de raid abierta y sin Pokémon dentro, invita a entrar hasta la pelea', () => {
    const s = played()
    const now = lobbyStart(3)
    expect(activities(s, now, null)).toEqual([{ kind: ActivityKind.RaidLobby, fightAt: fightStart(3), ready: true }])
    s.tutorial = initialState().tutorial
    expect(kinds(s, now)).toEqual([])
  })

  it('con un Pokémon en una sala, enseña esa sala y no la invitación', () => {
    const s = played()
    const rotation = RAID_ROTATIONS[0]
    s.raids[rotation] = { room: newRoom('r', rotation, 3, 1) } as TabRaid
    expect(activities(s, lobbyStart(3), null)).toEqual([{ kind: ActivityKind.Raid, rotation, fighting: false, ready: false }])
  })

  it('cuenta las del tablón con sitio en las que no está apuntado', () => {
    const board = [view({}), view({ you: {} as ScheduleView['you'] }), view({ phase: SchedulePhase.Started }), view({ phase: SchedulePhase.Committed })]
    expect(activities(played(), FIGHT_NOW, board)).toEqual([{ kind: ActivityKind.Board, open: 2, ready: false }])
  })

  it('no enseña la ruta, la torre ni las expediciones', () => {
    const s = played()
    s.run = { routeId: KANTO.routes[0].id, phase: 'walking' } as GameState['run']
    s.expeditions = [testExpedition('a', KANTO.routes[0].id)]
    expect(kinds(s)).toEqual([])
  })

  it('el orden: lo propio en marcha antes que lo abierto para unirse', () => {
    const s = played()
    s.incursion = { incursionId: INCURSION } as GameState['incursion']
    expect(kinds(s, FIGHT_NOW, [view({})])).toEqual([ActivityKind.Incursion, ActivityKind.Board])
  })
})

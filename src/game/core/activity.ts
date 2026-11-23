import type { IncursionId } from '../../data/incursions'
import { RAID_ROTATIONS, type RaidRotation } from '../raid/online/protocol'
import { cycleAt, fightStart, RaidStage, stageAt } from '../raid/raidSchedule'
import { checkInOpensAt, isPending } from '../incursion/schedule/scheduleRules'
import type { ScheduleView } from '../incursion/schedule/scheduleView'
import type { GameState } from './state'

// Las incursiones y raids en marcha en la partida y lo abierto para unirse, en el orden en que se enseña en la tira «En curso» del
// rancho. Cada actividad dice si pide que se mire ya (`ready`: el checkin por hacer, una sala abierta).

export const ActivityKind = {
  Incursion: 'incursion',
  Checkin: 'checkin',
  Scheduled: 'scheduled',
  Raid: 'raid',
  RaidLobby: 'raidLobby',
  Board: 'board',
} as const
export type ActivityKind = (typeof ActivityKind)[keyof typeof ActivityKind]

export type Activity = { ready: boolean } & (
  | { kind: typeof ActivityKind.Incursion; incursionId: IncursionId }
  /** Sala del checkin abierta: hasta la hora de empezar */
  | { kind: typeof ActivityKind.Checkin; incursionId: IncursionId; startAt: number }
  /** La próxima incursión programada en la que está apuntado (y cuántas tiene) */
  | { kind: typeof ActivityKind.Scheduled; incursionId: IncursionId; startAt: number; count: number }
  | { kind: typeof ActivityKind.Raid; rotation: RaidRotation; fighting: boolean }
  /** Sala de raid abierta sin Pokémon suyo: hasta que empieza la pelea */
  | { kind: typeof ActivityKind.RaidLobby; fightAt: number }
  /** Incursiones programadas por otros con sitio para apuntarse */
  | { kind: typeof ActivityKind.Board; open: number }
)

/**
 * Las incursiones y raids en marcha a `now` (hora del servidor). `board`: las incursiones programadas abiertas del tablón, si se
 * conocen; sin ellas no sale la del tablón
 */
export function activities(s: GameState, now: number, board: ScheduleView[] | null): Activity[] {
  const list: Activity[] = []
  if (s.incursion) list.push({ kind: ActivityKind.Incursion, incursionId: s.incursion.incursionId, ready: false })
  const checkin = s.incursionCheckin
  if (checkin) list.push({ kind: ActivityKind.Checkin, incursionId: checkin.incursionId, startAt: checkin.startAt, ready: !checkin.locked })
  list.push(...scheduled(s, now))
  list.push(...raids(s, now))
  const open = board?.filter((v) => v.you === null && isPending(v.phase)).length ?? 0
  if (open > 0) list.push({ kind: ActivityKind.Board, open, ready: false })
  return list
}

/** La próxima programada que aún no ha empezado (sin la del checkin abierto, que va aparte) */
function scheduled(s: GameState, now: number): Activity[] {
  const upcoming = s.incursionBonds
    .filter((b) => b.scheduleId !== s.incursionCheckin?.scheduleId && b.startAt > now)
    .sort((a, b) => a.startAt - b.startAt)
  const next = upcoming[0]
  if (!next) return []
  return [{ kind: ActivityKind.Scheduled, incursionId: next.incursionId, startAt: next.startAt, count: upcoming.length, ready: now >= checkInOpensAt(next.startAt) }]
}

/** Las salas en las que está y, si no está en ninguna y la sala está abierta, que se puede entrar (tras el tutorial) */
function raids(s: GameState, now: number): Activity[] {
  const joined = RAID_ROTATIONS.flatMap((rotation): Activity[] => {
    const tr = s.raids[rotation]
    return tr ? [{ kind: ActivityKind.Raid, rotation, fighting: tr.room.fight !== null, ready: false }] : []
  })
  if (joined.length > 0 || s.tutorial !== null) return joined
  const cycle = cycleAt(now)
  return stageAt(cycle, now) === RaidStage.Lobby ? [{ kind: ActivityKind.RaidLobby, fightAt: fightStart(cycle), ready: true }] : []
}

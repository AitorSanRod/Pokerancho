import { groupView, type SharedIncursion } from '../src/game/incursion/online/sharedIncursion'
import { cancelSchedule, createSchedule, joinSchedule, leaveSchedule, seatOf, type ScheduledIncursion, type ScheduleRefusal } from '../src/game/incursion/schedule/scheduledIncursion'
import { ScheduleAction, type ScheduleRequest, type ScheduleResponse } from '../src/game/incursion/schedule/scheduleProtocol'
import { cancelPush, newSchedulePush, openPushKey, roomOpenPush, type SchedulePush } from '../src/game/incursion/schedule/schedulePushes'
import { parseScheduleRequest } from '../src/game/incursion/schedule/scheduleRequests'
import { checkInSchedule, lockSchedule, markSchedule } from '../src/game/incursion/schedule/scheduleRoom'
import { isSettled, startSchedule } from '../src/game/incursion/schedule/scheduleStart'
import { scheduleView } from '../src/game/incursion/schedule/scheduleView'
import { loadGroup, saveGroup } from './db/incursions'
import { loadSchedule, saveSchedule, schedulesOf, upcomingSchedules, type StoredSchedule } from './db/schedules'
import type { Env } from './env'
import { json, readJson } from './http'
import { notifySchedule, unnotifySchedule } from './push/notify'

// POST /api/incursion-schedule: las incursiones programadas (ScheduleRequest, ver
// src/game/incursion/schedule/scheduleProtocol.ts). Toda la lógica es la del juego; aquí se lee, se guarda en D1 y se
// programan los avisos. A la hora de comienzo (o en cuanto todos fijan su Pokémon), la primera petición que la lea forma
// el grupo (o la cancela).

/** Veces que se repite una petición si otro jugador ha escrito la misma incursión justo a la vez */
const MAX_ATTEMPTS = 5
/** Bytes como mucho de una petición */
const MAX_REQUEST_BYTES = 8 * 1024
/** Bytes al azar de un id (en hexadecimal, el doble de letras) */
const ID_BYTES = 8

const CONFLICT = Symbol('conflict')
type Outcome = { response: ScheduleResponse; pushes: SchedulePush[]; unnotify: { playerIds: string[]; key: string } | null }

const newId = () => Array.from(crypto.getRandomValues(new Uint8Array(ID_BYTES)), (b) => b.toString(16).padStart(2, '0')).join('')
const reply = (response: ScheduleResponse, pushes: SchedulePush[] = []): Outcome => ({ response, pushes, unnotify: null })

/** Si le toca, forma el grupo (o la cancela); lo guarda todo si la incursión cambió. false si otro la escribió antes */
async function startIfDue(db: D1Database, stored: StoredSchedule, now: number): Promise<boolean> {
  const before = JSON.stringify(stored.sched)
  const group = startSchedule(stored.sched, newId(), now, Math.random)
  return saveIfChanged(db, stored, before, group, now)
}

/** Guarda la incursión si cambió desde `before` y, después, el grupo nuevo; false si otro la escribió antes */
async function saveIfChanged(db: D1Database, stored: StoredSchedule, before: string, group: SharedIncursion | null, now: number): Promise<boolean> {
  if (JSON.stringify(stored.sched) === before) return true
  stored.sched.updatedAt = now
  if (!(await saveSchedule(db, stored))) return false
  stored.version = (stored.version ?? 0) + 1
  if (group) await saveGroup(db, { group, version: null })
  return true
}

async function board(db: D1Database, playerId: string, now: number): Promise<Outcome | typeof CONFLICT> {
  const mine = await schedulesOf(db, playerId, now)
  for (const stored of mine) if (!(await startIfDue(db, stored, now))) return CONFLICT
  const open = (await upcomingSchedules(db, now)).filter((o) => !isSettled(o.sched))
  const view = (s: StoredSchedule) => scheduleView(s.sched, playerId, now)
  return reply({ board: { open: open.map(view), mine: mine.map(view), serverNow: now } })
}

async function create(db: D1Database, req: Extract<ScheduleRequest, { action: 'create' }>, now: number): Promise<Outcome | typeof CONFLICT> {
  const mine = (await schedulesOf(db, req.playerId, now)).map((m) => m.sched)
  const who = { playerId: req.playerId, nickname: req.nickname, bond: req.bond }
  const sched = createSchedule(newId(), req.incursionId, req.startAt, who, mine, now)
  if (typeof sched === 'string') return reply({ refused: sched })
  if (!(await saveSchedule(db, { sched, version: null }))) return CONFLICT
  return reply({ schedule: scheduleView(sched, req.playerId, now) }, [newSchedulePush(sched, now), roomOpenPush(sched, req.playerId)])
}

/** Aplica la acción a la incursión; devuelve el rechazo, si lo hay, y los avisos que tocan */
async function apply(db: D1Database, req: ScheduleRequest, sched: ScheduledIncursion, now: number): Promise<Omit<Outcome, 'response'> & { refused: ScheduleRefusal | null }> {
  const done = (refused: ScheduleRefusal | null, pushes: SchedulePush[] = [], unnotify: Outcome['unnotify'] = null) => ({ refused, pushes: refused ? [] : pushes, unnotify: refused ? null : unnotify })
  switch (req.action) {
    case ScheduleAction.Join: {
      const mine = (await schedulesOf(db, req.playerId, now)).map((m) => m.sched)
      return done(joinSchedule(sched, { playerId: req.playerId, nickname: req.nickname, bond: req.bond }, mine, now), [roomOpenPush(sched, req.playerId)])
    }
    case ScheduleAction.Leave:
      return done(leaveSchedule(sched, req.playerId, now), [], { playerIds: [req.playerId], key: openPushKey(sched) })
    case ScheduleAction.Cancel:
      return done(cancelSchedule(sched, req.playerId, now), [cancelPush(sched, now)], { playerIds: sched.seats.map((s) => s.playerId), key: openPushKey(sched) })
    case ScheduleAction.CheckIn:
      return done(checkInSchedule(sched, req.playerId, now))
    case ScheduleAction.Mark:
      return done(markSchedule(sched, req.playerId, req.member, now))
    case ScheduleAction.Lock:
      return done(lockSchedule(sched, req.playerId, now))
    default:
      return done(null)
  }
}

async function oneSchedule(db: D1Database, req: Exclude<ScheduleRequest, { action: 'board' | 'create' }>, now: number): Promise<Outcome | typeof CONFLICT> {
  const stored = await loadSchedule(db, req.scheduleId)
  if (!stored) return reply({ gone: true })
  const before = JSON.stringify(stored.sched)
  const dueGroup = startSchedule(stored.sched, newId(), now, Math.random)
  const { refused, pushes, unnotify } = await apply(db, req, stored.sched, now)
  // Al fijar el último, empieza ya
  const newGroup = dueGroup ?? startSchedule(stored.sched, newId(), now, Math.random)
  if (!(await saveIfChanged(db, stored, before, newGroup, now))) return CONFLICT
  if (refused) return reply({ refused })
  const schedule = scheduleView(stored.sched, req.playerId, now)
  const group = stored.sched.groupId && seatOf(stored.sched, req.playerId) ? await loadGroup(db, stored.sched.groupId) : null
  const view = group && groupView(group.group, req.playerId, now)
  return { response: view ? { schedule, group: view } : { schedule }, pushes, unnotify }
}

function handle(db: D1Database, req: ScheduleRequest, now: number): Promise<Outcome | typeof CONFLICT> {
  if (req.action === ScheduleAction.Board) return board(db, req.playerId, now)
  if (req.action === ScheduleAction.Create) return create(db, req, now)
  return oneSchedule(db, req, now)
}

export async function incursionScheduleRoute(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return json({ error: 'Solo POST' }, 405)
  const req = parseScheduleRequest(await readJson(request, MAX_REQUEST_BYTES))
  if (!req) return json({ error: 'Petición no válida' }, 400)
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const outcome = await handle(env.DB, req, Date.now())
    if (outcome === CONFLICT) continue
    if (outcome.unnotify) await unnotifySchedule(env.DB, outcome.unnotify.playerIds, outcome.unnotify.key)
    await notifySchedule(env.DB, outcome.pushes)
    return json(outcome.response)
  }
  return json({ error: 'La incursión está muy concurrida; prueba otra vez' }, 503)
}

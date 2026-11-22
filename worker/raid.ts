import { RAID_ROTATIONS, RaidAction, type BoardRequest, type JoinRequest, type RaidBoard, type RaidResponse, type RoomRequest } from '../src/game/raid/online/protocol'
import { damageDue } from '../src/game/raid/online/damageTally'
import { startPush } from '../src/game/raid/online/raidPushes'
import { parseRequest } from '../src/game/raid/online/requests'
import { advanceShared, createShared, critShared, joinShared, leaveShared, pickShared, roomFor, roomView, tapShared } from '../src/game/raid/online/sharedRaid'
import { roomBoss } from '../src/game/raid/raidRoom'
import { cycleAt, RaidStage, stageAt } from '../src/game/raid/raidSchedule'
import { countChannel, loadChannel, loadRoom, saveRoom } from './db/rooms'
import type { Env } from './env'
import { json, readJson } from './http'
import { notifyRaid } from './push/notify'

// POST /api/raid: las salas de los jefes de la pestaña Raids (RaidRequest, ver src/game/raid/online/protocol.ts). Toda
// la lógica es la del juego (el calendario, las salas y las ventanas de toques); aquí solo se lee y se guarda en D1.
// Sin cuentas: el jugador va por su id.

/** Veces que se repite una petición si otro jugador ha escrito la sala justo a la vez */
const MAX_ATTEMPTS = 5
/** Letras al azar del id de una sala nueva */
const ROOM_ID_LENGTH = 8
/** Bytes como mucho de una petición */
const MAX_REQUEST_BYTES = 8 * 1024
/** Una consulta que no cambia nada solo se guarda (para que la sala no caduque) si lleva este tiempo sin guardarse */
const TOUCH_MS = 10 * 60 * 1000

const CONFLICT = Symbol('conflict')
type Outcome = RaidResponse | typeof CONFLICT

const GONE: RaidResponse = { gone: true }

const randomId = () => crypto.randomUUID().replaceAll('-', '').slice(0, ROOM_ID_LENGTH)

/** Cuántos esperan o luchan contra el jefe de ahora de cada rotación */
async function board(db: D1Database, now: number): Promise<RaidBoard> {
  const cycle = cycleAt(now)
  const rotations = await Promise.all(RAID_ROTATIONS.map(async (rotation) => ({ rotation, cycle, ...(await countChannel(db, rotation, cycle)) })))
  return { serverNow: now, rotations }
}

/**
 * Entrar en la sala abierta de la rotación (o cambiar el Pokémon o el ataque) o en su pelea ya empezada: la suya si ya
 * está en una, la que tenga más jugadores con sitio o una nueva. Al sentarse por primera vez se le programa el aviso de cuando empiece la pelea
 */
async function join(db: D1Database, req: JoinRequest): Promise<Outcome> {
  const now = Date.now()
  const cycle = cycleAt(now)
  const stored = await loadChannel(db, req.rotation, cycle)
  const found = roomFor(
    stored.map((s) => s.room),
    req.playerId,
    now,
  )
  const room = found ?? createShared(`tab/${req.rotation}/${cycle}/${randomId()}`, req.rotation, cycle, now, Math.random)
  const version = stored.find((s) => s.room === found)?.version ?? null
  const isNew = !room.seats.some((s) => s.playerId === req.playerId)
  advanceShared(room, now)
  if (req.member.level < (roomBoss(room).minLevel ?? 0)) return GONE
  if (!joinShared(room, req.playerId, req.nickname, req.member, now)) return GONE
  if (!(await saveRoom(db, { room, version }, now))) return CONFLICT
  // Con la pelea ya empezada no hay aviso de que empieza
  if (isNew && stageAt(cycle, now) === RaidStage.Lobby) await notifyRaid(db, [startPush(room, req.playerId)])
  return { room: roomView(room, req.playerId, now)! }
}

async function roomAction(db: D1Database, req: RoomRequest): Promise<Outcome> {
  const now = Date.now()
  const stored = await loadRoom(db, req.roomId)
  const room = stored?.room
  if (!stored || !room || !room.seats.some((s) => s.playerId === req.playerId)) return GONE
  const before = JSON.stringify(room)
  const savedAt = room.updatedAt
  advanceShared(room, now)
  if (req.action === RaidAction.Leave) leaveShared(room, req.playerId)
  if (req.action === RaidAction.Tap) tapShared(room, req.playerId, req.turn, req.score, now)
  if (req.action === RaidAction.Pick) pickShared(room, req.playerId, { moveId: req.moveId, target: req.target }, now)
  if (req.action === RaidAction.Crit) critShared(room, req.playerId, now)
  const changed = JSON.stringify({ ...room, updatedAt: savedAt }) !== before || damageDue(room, now)
  if ((changed || now - savedAt > TOUCH_MS) && !(await saveRoom(db, stored, now))) return CONFLICT
  const view = roomView(room, req.playerId, now)
  return view ? { room: view } : GONE
}

function handle(db: D1Database, req: BoardRequest | JoinRequest | RoomRequest): Promise<Outcome> {
  if (req.action === RaidAction.Board) return board(db, Date.now()).then((b) => ({ board: b }))
  if (req.action === RaidAction.Join) return join(db, req)
  return roomAction(db, req)
}

export async function raidRoute(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return json({ error: 'Solo POST' }, 405)
  const req = parseRequest(await readJson(request, MAX_REQUEST_BYTES))
  if (!req) return json({ error: 'Petición no válida' }, 400)
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const outcome = await handle(env.DB, req)
    if (outcome !== CONFLICT) return json(outcome)
  }
  return json({ error: 'La sala está muy concurrida; prueba otra vez' }, 503)
}

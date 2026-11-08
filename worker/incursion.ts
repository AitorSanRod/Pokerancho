import { IncursionAction, type GroupRequest, type IncursionRequest, type IncursionResponse, type QueueRequest } from '../src/game/incursion/online/protocol'
import { parseIncursionRequest } from '../src/game/incursion/online/requests'
import { advanceShared, chooseShared, formGroup, groupView, pickGroup, readyShared, voteShared } from '../src/game/incursion/online/sharedIncursion'
import { claimQueued, formedGroupOf, leaveQueue, loadGroup, saveGroup, upsertQueue, waitingFor } from './db/incursions'
import type { Env } from './env'
import { json, readJson } from './http'

// POST /api/incursion: cola y grupos de las incursiones con otros jugadores (IncursionRequest, ver
// src/game/incursion/online/protocol.ts). Toda la lógica es la del juego; aquí solo se lee y se guarda en D1.

/** Veces que se repite una petición si otro jugador ha escrito el grupo justo a la vez */
const MAX_ATTEMPTS = 5
/** Bytes como mucho de una petición */
const MAX_REQUEST_BYTES = 8 * 1024
/** Bytes al azar del id de un grupo (en hexadecimal, el doble de letras) */
const GROUP_ID_BYTES = 8
/** Una consulta que no cambia nada solo se guarda (para que el grupo no caduque) si lleva este tiempo sin guardarse */
const TOUCH_MS = 10 * 60 * 1000

const CONFLICT = Symbol('conflict')
type Outcome = IncursionResponse | typeof CONFLICT

const newGroupId = () => Array.from(crypto.getRandomValues(new Uint8Array(GROUP_ID_BYTES)), (b) => b.toString(16).padStart(2, '0')).join('')

/** El jugador recoge el grupo que se le formó en la cola (y sale de ella); null si el grupo ya no existe */
async function pickUp(db: D1Database, groupId: string, playerId: string, now: number): Promise<IncursionResponse | null> {
  const stored = await loadGroup(db, groupId)
  await leaveQueue(db, playerId)
  const view = stored && groupView(stored.group, playerId, now)
  return view ? { group: view } : null
}

async function queue(db: D1Database, req: QueueRequest): Promise<IncursionResponse> {
  const now = Date.now()
  const formed = await formedGroupOf(db, req.playerId)
  const picked = formed && (await pickUp(db, formed, req.playerId, now))
  if (picked) return picked
  const since = await upsertQueue(db, { ...req }, now)
  const waiting = await waitingFor(db, req.incursionId, now)
  const players = pickGroup(waiting, now)
  if (players) {
    const id = newGroupId()
    if (await claimQueued(db, id, players.map((p) => p.playerId))) {
      await saveGroup(db, { group: formGroup(id, req.incursionId, players, now, Math.random), version: null })
      if (players.some((p) => p.playerId === req.playerId)) return (await pickUp(db, id, req.playerId, now)) ?? { gone: true }
    }
  }
  return { queue: { waiting: waiting.length, since } }
}

/** Salir de la cola; si el grupo ya se había formado, se devuelve (el jugador ya está en él) */
async function leave(db: D1Database, playerId: string): Promise<IncursionResponse> {
  const formed = await formedGroupOf(db, playerId)
  const picked = formed && (await pickUp(db, formed, playerId, Date.now()))
  if (picked) return picked
  await leaveQueue(db, playerId)
  return { gone: true }
}

async function groupAction(db: D1Database, req: GroupRequest): Promise<Outcome> {
  const now = Date.now()
  const stored = await loadGroup(db, req.groupId)
  const g = stored?.group
  if (!stored || !g || !g.seats.some((s) => s.playerId === req.playerId)) return { gone: true }
  const before = JSON.stringify(g)
  const savedAt = g.updatedAt
  advanceShared(g, now)
  if (req.action === IncursionAction.Move) chooseShared(g, req.playerId, req.moveId, now)
  if (req.action === IncursionAction.Ready) readyShared(g, req.playerId, now)
  if (req.action === IncursionAction.Vote) voteShared(g, req.playerId, req.retreat, now)
  const changed = JSON.stringify({ ...g, updatedAt: savedAt }) !== before
  if ((changed || now - savedAt > TOUCH_MS) && !(await saveGroup(db, stored))) return CONFLICT
  return { group: groupView(g, req.playerId, now)! }
}

async function handle(db: D1Database, req: IncursionRequest): Promise<Outcome> {
  if (req.action === IncursionAction.Queue) return queue(db, req)
  if (req.action === IncursionAction.Leave) return leave(db, req.playerId)
  return groupAction(db, req)
}

export async function incursionRoute(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return json({ error: 'Solo POST' }, 405)
  const req = parseIncursionRequest(await readJson(request, MAX_REQUEST_BYTES))
  if (!req) return json({ error: 'Petición no válida' }, 400)
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const outcome = await handle(env.DB, req)
    if (outcome !== CONFLICT) return json(outcome)
  }
  return json({ error: 'El grupo está muy concurrido; prueba otra vez' }, 503)
}

import { takeBossDamage } from '../src/game/incursion/online/bossDamage'
import { IncursionAction, type GroupRequest, type IncursionResponse } from '../src/game/incursion/online/protocol'
import { parseIncursionRequest } from '../src/game/incursion/online/requests'
import { advanceShared, chooseShared, groupView, pickShared, readyShared, tapShared, voteShared } from '../src/game/incursion/online/sharedIncursion'
import { addDamage } from './db/damageRanking'
import { loadGroup, saveGroup } from './db/incursions'
import type { Env } from './env'
import { json, readJson } from './http'

// POST /api/incursion: los grupos de las incursiones con otros jugadores, ya formados a la hora de una incursión
// programada (GroupRequest, ver src/game/incursion/online/protocol.ts; las programadas, en incursionSchedule.ts). Toda la
// lógica es la del juego; aquí solo se lee y se guarda en D1.

/** Veces que se repite una petición si otro jugador ha escrito el grupo justo a la vez */
const MAX_ATTEMPTS = 5
/** Bytes como mucho de una petición */
const MAX_REQUEST_BYTES = 8 * 1024
/** Una consulta que no cambia nada solo se guarda (para que el grupo no caduque) si lleva este tiempo sin guardarse */
const TOUCH_MS = 10 * 60 * 1000

const CONFLICT = Symbol('conflict')
type Outcome = IncursionResponse | typeof CONFLICT

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
  if (req.action === IncursionAction.Tap) tapShared(g, req.playerId, req.leg, req.turn, req.score, now)
  if (req.action === IncursionAction.Pick) pickShared(g, req.playerId, { moveId: req.moveId, target: req.target }, now)
  const tally = takeBossDamage(g, now)
  const changed = JSON.stringify({ ...g, updatedAt: savedAt }) !== before
  if ((changed || now - savedAt > TOUCH_MS) && !(await saveGroup(db, stored))) return CONFLICT
  await addDamage(db, tally, now)
  return { group: groupView(g, req.playerId, now)! }
}

export async function incursionRoute(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return json({ error: 'Solo POST' }, 405)
  const req = parseIncursionRequest(await readJson(request, MAX_REQUEST_BYTES))
  if (!req) return json({ error: 'Petición no válida' }, 400)
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const outcome = await groupAction(env.DB, req)
    if (outcome !== CONFLICT) return json(outcome)
  }
  return json({ error: 'El grupo está muy concurrido; prueba otra vez' }, 503)
}

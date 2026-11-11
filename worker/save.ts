import { AuthCode } from '../src/game/core/accountRules'
import { MAX_SAVE_BYTES, parseUpload, SaveRejection, type CloudSave } from '../src/game/core/cloudSave'
import { sessionUser } from './auth/session'
import { loadSave, saveVersionOf, writeSave } from './db/saves'
import type { Env } from './env'
import { json, readJson, sameOrigin } from './http'

// /api/save: la partida en la nube de la cuenta con sesión. GET la devuelve; POST sube una encima de la revisión que
// el dispositivo vio por última vez: si en la nube hay otra más nueva, 409 con ella; si la de la nube es de una versión
// más nueva de la app, 409 con SaveRejection.OutdatedApp (hay que actualizar la app antes de subir).

async function upload(env: Env, request: Request, userId: string): Promise<Response> {
  if (!sameOrigin(request)) return json({ code: AuthCode.WrongOrigin }, 403)
  const up = parseUpload(await readJson(request, MAX_SAVE_BYTES))
  if (!up) return json({ error: 'Petición no válida' }, 400)
  const cloud: CloudSave = { save: up.save, team: up.team, revision: (up.baseRevision ?? 0) + 1, updatedAt: Date.now() }
  if (await writeSave(env.DB, userId, cloud, up.baseRevision)) return json({ revision: cloud.revision, updatedAt: cloud.updatedAt })
  const current = await loadSave(env.DB, userId)
  // Una app sin actualizar no sabría leer la de la nube: no se le da, se le pide que se actualice (su partida sigue en el móvil)
  if (current && saveVersionOf(current) > saveVersionOf(cloud)) return json({ cloud: null, code: SaveRejection.OutdatedApp }, 409)
  return json({ cloud: current }, 409)
}

export async function saveRoute(request: Request, env: Env): Promise<Response> {
  const user = await sessionUser(env.DB, request, Date.now())
  if (!user) return json({ code: AuthCode.SignedOut }, 401)
  if (request.method === 'GET') return json({ cloud: await loadSave(env.DB, user.id) })
  if (request.method === 'POST') return upload(env, request, user.id)
  return json({ error: 'Solo GET o POST' }, 405)
}

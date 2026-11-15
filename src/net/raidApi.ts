import type { RaidRequest, RaidResponse } from '../game/raid/online/protocol'
import { postJson } from './apiFetch'

/** Dirección del servidor de raids (worker/raid.ts) */
const RAID_API = '/api/raid'

/** Error de red o del servidor: sin él (p. ej. con `npm run dev`), las salas se juegan en local */
export class RaidApiError extends Error {}

export async function postRaid(req: RaidRequest): Promise<RaidResponse> {
  let res: Response
  try {
    res = await postJson(RAID_API, req)
  } catch (e) {
    throw new RaidApiError(`Sin conexión con el servidor de raids: ${String(e)}`)
  }
  const body = res.ok && res.headers.get('content-type')?.includes('application/json') ? ((await res.json()) as RaidResponse) : null
  if (!body) throw new RaidApiError(`El servidor de raids respondió ${res.status}`)
  return body
}

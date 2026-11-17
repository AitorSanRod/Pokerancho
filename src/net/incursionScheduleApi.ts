import { DEFAULT_NICKNAME } from '../game/raid/online/protocol'
import type { ScheduleRequest, ScheduleResponse } from '../game/incursion/schedule/scheduleProtocol'
import { postJson } from './apiFetch'
import { nickname, playerId } from './identity'

/** Dirección del servidor de incursiones programadas (worker/incursionSchedule.ts) */
const SCHEDULE_API = '/api/incursion-schedule'

/** Error de red o del servidor: sin él (p. ej. con `npm run dev`), no hay incursiones programadas, solo «Jugar ya» */
export class ScheduleApiError extends Error {}

type Without<T> = T extends unknown ? Omit<T, 'playerId' | 'nickname'> : never
/** Una petición sin quién la hace (lo pone `postSchedule`) */
export type ScheduleCall = Without<ScheduleRequest>

export async function postSchedule(req: ScheduleCall): Promise<ScheduleResponse> {
  let res: Response
  try {
    res = await postJson(SCHEDULE_API, { ...req, playerId: playerId(), nickname: nickname() ?? DEFAULT_NICKNAME })
  } catch (e) {
    throw new ScheduleApiError(`Sin conexión con el servidor de incursiones: ${String(e)}`)
  }
  const body = res.ok && res.headers.get('content-type')?.includes('application/json') ? ((await res.json()) as ScheduleResponse) : null
  if (!body) throw new ScheduleApiError(`El servidor de incursiones respondió ${res.status}`)
  return body
}

import { cleanNickname } from '../../raid/online/requests'
import { needsKey } from '../keys'
import { isIncursion, isInt, isObject, matches, parseMember, PLAYER_ID } from '../online/requests'
import { ScheduleAction, type ScheduleRequest } from './scheduleProtocol'

// Lo que llega al servidor de incursiones programadas viene de cualquiera: se comprueba todo y se descarta lo que no
// encaje. Las reglas (fases, topes) las aplica después scheduledIncursion.ts y scheduleRoom.ts.

export const SCHEDULE_ID = /^[a-f0-9]{8,32}$/

const isBond = (v: unknown): v is number => isInt(v, 0, Number.MAX_SAFE_INTEGER)

/** La petición si es válida; null si falta o sobra algo */
export function parseScheduleRequest(body: unknown): ScheduleRequest | null {
  if (!isObject(body) || !matches(body.playerId, PLAYER_ID)) return null
  const who = { playerId: body.playerId, nickname: cleanNickname(body.nickname) }
  if (body.action === ScheduleAction.Board) return { action: ScheduleAction.Board, ...who }
  if (body.action === ScheduleAction.Create) {
    const { incursionId, startAt, bond } = body
    const ok = isIncursion(incursionId) && needsKey(incursionId) && Number.isSafeInteger(startAt) && isBond(bond)
    return ok ? { action: ScheduleAction.Create, ...who, incursionId, startAt: startAt as number, bond } : null
  }
  if (!matches(body.scheduleId, SCHEDULE_ID)) return null
  const one = { ...who, scheduleId: body.scheduleId }
  switch (body.action) {
    case ScheduleAction.Join:
      return isBond(body.bond) ? { action: ScheduleAction.Join, ...one, bond: body.bond } : null
    case ScheduleAction.Mark: {
      if (!isIncursion(body.incursionId)) return null
      const member = parseMember(body.incursionId, body.member)
      return member && { action: ScheduleAction.Mark, ...one, incursionId: body.incursionId, member }
    }
    case ScheduleAction.Leave:
    case ScheduleAction.Cancel:
    case ScheduleAction.Sync:
    case ScheduleAction.CheckIn:
    case ScheduleAction.Lock:
      return { action: body.action, ...one }
    default:
      return null
  }
}

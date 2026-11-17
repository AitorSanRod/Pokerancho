import { checkinMember } from '../game/incursion/schedule/scheduleCheckin'
import { ScheduleAction } from '../game/incursion/schedule/scheduleProtocol'
import type { ScheduleView } from '../game/incursion/schedule/scheduleView'
import { getState } from '../store/store'
import { applyScheduleResponse, boardWatched, refreshScheduleBoard } from './incursionBoard'
import { postSchedule, ScheduleApiError } from './incursionScheduleApi'

// Mantiene al día con el servidor lo de las incursiones programadas aunque no se mire el tablón: en la sala del checkin
// consulta a menudo y le dice qué Pokémon y ataque lleva marcados (y si los ha fijado); con fianzas retenidas, mira el
// tablón de vez en cuando para liquidarlas. Solo con la app delante.

/** Milisegundos reales entre consultas en la sala del checkin */
const ROOM_SYNC_MS = 3_000
/** Milisegundos reales entre consultas del tablón con fianzas retenidas y sin mirarlo */
const BONDS_SYNC_MS = 60_000
/** Cada cuánto se mira si toca alguna consulta */
const LOOP_MS = 1_000

let busy = false
let lastRoom = 0
let lastBonds = 0

/** Lo que el servidor aún no sabe de lo marcado en la sala: el Pokémon y el ataque, o que ya está fijado */
async function pushMarks(view: ScheduleView) {
  const c = getState().incursionCheckin
  const you = view.you
  if (!c || c.scheduleId !== view.id || !you?.checkedIn || you.locked) return
  const member = checkinMember(getState())
  if (member && (you.memberId !== member.id || you.moveId !== member.moveId)) {
    await postSchedule({ action: ScheduleAction.Mark, scheduleId: c.scheduleId, incursionId: c.incursionId, member }).then((r) => applyScheduleResponse(r, c.scheduleId))
  }
  if (c.locked && c.uid) await postSchedule({ action: ScheduleAction.Lock, scheduleId: c.scheduleId }).then((r) => applyScheduleResponse(r, c.scheduleId))
}

async function syncRoom(scheduleId: string) {
  const res = await postSchedule({ action: ScheduleAction.Sync, scheduleId })
  applyScheduleResponse(res, scheduleId)
  if ('schedule' in res) await pushMarks(res.schedule)
}

async function step(force = false) {
  const s = getState()
  if (busy || document.hidden) return
  const now = Date.now()
  const room = s.incursionCheckin?.scheduleId
  const roomDue = room && (force || now - lastRoom >= ROOM_SYNC_MS)
  const bondsDue = !room && s.incursionBonds.length > 0 && !boardWatched() && now - lastBonds >= BONDS_SYNC_MS
  if (!roomDue && !bondsDue) return
  busy = true
  try {
    if (roomDue) {
      lastRoom = now
      await syncRoom(room)
    } else {
      lastBonds = now
      await refreshScheduleBoard()
    }
  } catch (e) {
    if (!(e instanceof ScheduleApiError)) throw e
  } finally {
    busy = false
  }
}

/** Avisa enseguida al servidor de un cambio en la sala (Pokémon, ataque, fijar) */
export const syncScheduleRoomNow = () => void step(true)

/** Arranca el bucle (una vez, en App); devuelve cómo pararlo */
export function startScheduleSync(): () => void {
  const id = setInterval(() => void step(), LOOP_MS)
  const onVisible = () => {
    lastRoom = 0
    lastBonds = 0
    void step()
  }
  document.addEventListener('visibilitychange', onVisible)
  return () => {
    clearInterval(id)
    document.removeEventListener('visibilitychange', onVisible)
  }
}

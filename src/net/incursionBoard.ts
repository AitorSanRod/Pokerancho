import { useEffect, useSyncExternalStore } from 'react'
import type { IncursionId } from '../data/incursions'
import { applyGroupView } from '../game/incursion/online/linkedIncursion'
import { applyScheduleView, scheduleGone } from '../game/incursion/schedule/linkedSchedule'
import type { ScheduleRefusal } from '../game/incursion/schedule/scheduledIncursion'
import { ScheduleAction, type BoardView, type ScheduleResponse } from '../game/incursion/schedule/scheduleProtocol'
import { bondFor } from '../game/incursion/schedule/scheduleRules'
import type { ScheduleView } from '../game/incursion/schedule/scheduleView'
import { act, getState } from '../store/store'
import { postSchedule, ScheduleApiError, type ScheduleCall } from './incursionScheduleApi'

// El tablón de incursiones programadas tal y como lo vio la web la última vez (las de todos y las del jugador) y las
// operaciones sobre ellas. Se pide cada poco mientras se mira la pestaña, al volver a la app y tras cada operación. Lo que dice el
// servidor de las del jugador se aplica a la partida (fianzas y checkin, ver game/incursion/schedule/linkedSchedule.ts).

/** Milisegundos reales entre consultas del tablón mientras se mira (solo lee: no escribe en D1) */
const REFRESH_EVERY_MS = 30_000

interface ScheduleBoardState {
  board: BoardView | null
  /** null: aún no se sabe si hay servidor; false: no lo hay (solo «Jugar ya») */
  online: boolean | null
  loading: boolean
  /** Diferencia entre la hora del servidor y la de aquí, para las cuentas atrás */
  clockOffset: number
}

let current: ScheduleBoardState = { board: null, online: null, loading: false, clockOffset: 0 }
const listeners = new Set<() => void>()
let watchers = 0
/** Operaciones mandadas: si alguna se cruza con una consulta del tablón, lo que falte en él no se da por perdido */
let operations = 0

function update(patch: Partial<ScheduleBoardState>) {
  current = { ...current, ...patch }
  listeners.forEach((l) => l())
}

/** Pone en el tablón lo último que se sabe de una */
function replaceInBoard(view: ScheduleView) {
  const b = current.board
  if (!b) return
  const swap = (list: ScheduleView[]) => list.map((v) => (v.id === view.id ? view : v))
  const mine = b.mine.some((v) => v.id === view.id) || !view.you ? swap(b.mine) : [...b.mine, view]
  update({ board: { ...b, open: swap(b.open), mine: view.you ? mine : mine.filter((v) => v.id !== view.id) } })
}

/** El tablón en la partida; con `complete`, una fianza de una que ya no sale entre las suyas se da por perdida */
function applyBoard(board: BoardView, complete: boolean) {
  update({ board, online: true, clockOffset: board.serverNow - Date.now() })
  const listed = new Set(board.mine.map((v) => v.id))
  act((s) => {
    for (const view of board.mine) applyScheduleView(s, view, view.serverNow)
    if (complete) for (const bond of s.incursionBonds.filter((b) => !listed.has(b.scheduleId))) scheduleGone(s, bond.scheduleId)
  })
}

/** Aplica la respuesta a una operación o consulta de una; devuelve el rechazo, si lo hay */
export function applyScheduleResponse(res: ScheduleResponse, scheduleId: string | null): ScheduleRefusal | null {
  if ('board' in res) applyBoard(res.board, false)
  else if ('refused' in res) return res.refused
  else if ('gone' in res) {
    if (scheduleId) act((s) => scheduleGone(s, scheduleId))
  } else {
    const { schedule, group } = res
    if (group) act((s) => applyGroupView(s, group, Date.now()))
    act((s) => applyScheduleView(s, schedule, schedule.serverNow))
    replaceInBoard(schedule)
  }
  return null
}

/** Vuelve a pedir el tablón */
export async function refreshScheduleBoard() {
  update({ loading: true })
  const before = operations
  try {
    const res = await postSchedule({ action: ScheduleAction.Board })
    if ('board' in res) applyBoard(res.board, operations === before)
  } catch (e) {
    if (!(e instanceof ScheduleApiError)) throw e
    update({ online: false })
  } finally {
    update({ loading: false })
  }
}

/** Manda una operación; devuelve el rechazo (o 'offline' sin conexión) y vuelve a pedir el tablón */
async function operate(req: ScheduleCall, scheduleId: string | null): Promise<ScheduleRefusal | 'offline' | null> {
  operations++
  try {
    const refused = applyScheduleResponse(await postSchedule(req), scheduleId)
    void refreshScheduleBoard()
    return refused
  } catch (e) {
    if (!(e instanceof ScheduleApiError)) throw e
    return 'offline'
  } finally {
    operations++
  }
}

const bond = () => bondFor(getState().money)

export const scheduleIncursion = (incursionId: IncursionId, startAt: number) => operate({ action: ScheduleAction.Create, incursionId, startAt, bond: bond() }, null)
export const joinScheduled = (scheduleId: string) => operate({ action: ScheduleAction.Join, scheduleId, bond: bond() }, scheduleId)
export const leaveScheduled = (scheduleId: string) => operate({ action: ScheduleAction.Leave, scheduleId }, scheduleId)
export const cancelScheduled = (scheduleId: string) => operate({ action: ScheduleAction.Cancel, scheduleId }, scheduleId)
export const checkInScheduled = (scheduleId: string) => operate({ action: ScheduleAction.CheckIn, scheduleId }, scheduleId)

/** El tablón mientras se mira (lo pide al montarse, cada REFRESH_EVERY_MS y al volver a la app) */
export function useScheduleBoard(): ScheduleBoardState {
  useEffect(() => {
    watchers++
    void refreshScheduleBoard()
    const id = setInterval(() => !document.hidden && void refreshScheduleBoard(), REFRESH_EVERY_MS)
    const onVisible = () => !document.hidden && void refreshScheduleBoard()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      watchers--
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => current,
  )
}

/** Alguien está mirando el tablón (no hace falta pedirlo aparte) */
export const boardWatched = (): boolean => watchers > 0

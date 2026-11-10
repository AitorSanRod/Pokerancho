import { useSyncExternalStore } from 'react'
import { act, getState } from '../game/core/store'
import { incursionProgress, IncursionPhase } from '../game/incursion/activeIncursion'
import { IncursionOutcome } from '../game/incursion/incursionRun'
import { applyGroupView, dropGroup, leaveQueue, playQueueLocally, queueRequest } from '../game/incursion/online/linkedIncursion'
import { IncursionAction, type IncursionResponse, type QueueView } from '../game/incursion/online/protocol'
import { DEFAULT_NICKNAME } from '../game/raid/online/protocol'
import { IncursionApiError, postIncursion } from './incursionApi'
import { nickname, playerId } from './identity'

// Mantiene la incursión de la partida al día con el servidor: sigue en la cola hasta que se forma el grupo y, dentro,
// consulta lo que han decidido los demás. Solo con la app delante. Sin servidor, la cola se juega en local con bots.
// Cada consulta gasta cuota del plan de Cloudflare: ver docs/servidor.md.

/** Milisegundos reales entre consultas en la cola y en la sala de reorganizar */
const QUICK_SYNC_MS = 3_000
/** Milisegundos reales entre consultas mientras se juega un tramo sin ventana de toques pendiente */
const PLAY_SYNC_MS = 10_000
/**
 * Milisegundos reales entre consultas con una ventana de toques pendiente ya cerrada: hay que saber enseguida quién
 * potenció su ataque para que el turno empiece a tiempo
 */
const TAP_RESULT_SYNC_MS = 800
/** Cada cuánto se mira si toca alguna consulta */
const LOOP_MS = 1_000

let busy = false
let lastSync = 0
let queue: QueueView | null = null
const listeners = new Set<() => void>()

const who = () => ({ playerId: playerId(), nickname: nickname() ?? DEFAULT_NICKNAME })

function setQueue(view: QueueView | null) {
  queue = view
  listeners.forEach((l) => l())
}

/** Aplica la respuesta del servidor a la partida */
function apply(res: IncursionResponse, groupId: string | null) {
  if ('group' in res) act((s) => applyGroupView(s, res.group, Date.now()))
  else if ('queue' in res) setQueue(res.queue)
  else if (groupId) act((s) => dropGroup(s, groupId))
}

async function syncQueue() {
  const req = queueRequest(getState())
  if (!req) return
  try {
    apply(await postIncursion({ ...req, ...who() }), null)
  } catch (e) {
    if (!(e instanceof IncursionApiError)) throw e
    act((s) => playQueueLocally(s, Date.now()))
  }
  if (!getState().incursionQueue) setQueue(null)
}

function syncEvery(): number {
  const a = getState().incursion
  if (!a) return PLAY_SYNC_MS
  const p = incursionProgress(a, Date.now())
  if (p.phase === IncursionPhase.Regroup || p.phase === IncursionPhase.Tap) return QUICK_SYNC_MS
  return p.record.outcome === IncursionOutcome.Waiting ? TAP_RESULT_SYNC_MS : PLAY_SYNC_MS
}

async function step() {
  const s = getState()
  const groupId = s.incursion?.online?.groupId ?? null
  if (busy || document.hidden || (!s.incursionQueue && !groupId)) return
  const every = s.incursionQueue ? QUICK_SYNC_MS : syncEvery()
  if (Date.now() - lastSync < every) return
  busy = true
  lastSync = Date.now()
  try {
    if (s.incursionQueue) await syncQueue()
    else if (groupId) apply(await postIncursion({ action: IncursionAction.Sync, groupId, ...who() }), groupId)
  } catch (e) {
    if (!(e instanceof IncursionApiError)) throw e
  } finally {
    busy = false
  }
}

/** Manda una decisión del jugador en su grupo (movimiento, seguir, voto) y aplica la respuesta; sin conexión, no pasa nada */
async function sendToGroup(
  extra:
    | { action: typeof IncursionAction.Move; moveId: string }
    | { action: typeof IncursionAction.Ready }
    | { action: typeof IncursionAction.Vote; retreat: boolean }
    | { action: typeof IncursionAction.Tap; leg: number; turn: number }
    | { action: typeof IncursionAction.Pick; moveId: string; target: string | null },
) {
  const groupId = getState().incursion?.online?.groupId
  if (!groupId) return
  try {
    apply(await postIncursion({ ...extra, groupId, ...who() }), groupId)
  } catch (e) {
    if (!(e instanceof IncursionApiError)) throw e
  }
}

export const sendIncursionMove = (moveId: string) => sendToGroup({ action: IncursionAction.Move, moveId })
export const sendIncursionReady = () => sendToGroup({ action: IncursionAction.Ready })
export const sendIncursionVote = (retreat: boolean) => sendToGroup({ action: IncursionAction.Vote, retreat })
/** Cambia el ataque de su Pokémon y a quién lo dirige, desde la próxima ventana */
export const sendIncursionPick = (moveId: string, target: string | null) => sendToGroup({ action: IncursionAction.Pick, moveId, target })
/** Ha llegado a los toques en la ventana `turn` del tramo `leg` */
export const sendIncursionTap = (leg: number, turn: number) => sendToGroup({ action: IncursionAction.Tap, leg, turn })

/** Sale de la cola; si el grupo ya se había formado, entra en él */
export async function leaveIncursionQueue() {
  try {
    const res = await postIncursion({ action: IncursionAction.Leave, ...who() })
    if ('group' in res) return apply(res, null)
  } catch (e) {
    if (!(e instanceof IncursionApiError)) throw e
  }
  act(leaveQueue)
  setQueue(null)
}

/** Arranca el bucle (una vez, en App); devuelve cómo pararlo */
export function startIncursionSync(): () => void {
  const id = setInterval(step, LOOP_MS)
  const onVisible = () => {
    lastSync = 0
    void step()
  }
  document.addEventListener('visibilitychange', onVisible)
  return () => {
    clearInterval(id)
    document.removeEventListener('visibilitychange', onVisible)
  }
}

/** Lo último que dijo el servidor de la cola (null hasta la primera respuesta) */
export function useIncursionQueue(): QueueView | null {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => queue,
  )
}

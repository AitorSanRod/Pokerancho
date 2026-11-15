import { act, getState } from '../store/store'
import { IncursionPhase } from '../game/incursion/activeIncursion'
import { IncursionOutcome } from '../game/incursion/incursionRun'
import { RaidLink, type TabRaid } from '../game/raid/raid'
import { fightDue } from '../game/raid/raidLobby'
import { raidProgress } from '../game/raid/raidPlay'
import { applyRoomView, dropRoom, joinRequest } from '../game/raid/online/linkedRaid'
import { DEFAULT_NICKNAME, RAID_ROTATIONS, RaidAction, type RaidResponse, type RaidRotation, type RoomRequest } from '../game/raid/online/protocol'
import { nickname, playerId } from './identity'
import { postRaid, RaidApiError } from './raidApi'

// Mantiene las salas de la partida al día con el servidor: pide entrar (o cambiar el Pokémon o el ataque), consulta
// las suyas y avisa de las que se han dejado. Solo con la app delante; al volver se consulta enseguida. Sin servidor, o
// si deja de tener la sala, se sigue en local con bots. Cada consulta gasta cuota del plan de Cloudflare: ver
// docs/servidor.md.

/** Milisegundos reales entre consultas con la sala abierta (para ver quién entra) */
const LOBBY_SYNC_MS = 30_000
/** Milisegundos reales entre consultas en la pelea, sin ventana de toques pendiente */
const FIGHT_SYNC_MS = 10_000
/** Con la ventana de toques abierta: lo que se decide en ella llega antes */
const TAP_SYNC_MS = 3_000
/** Con una ventana ya cerrada de la que aún no se sabe el resultado: hace falta enseguida para que empiece el turno */
const TAP_RESULT_SYNC_MS = 800
/** Cada cuánto se mira si toca alguna consulta */
const LOOP_MS = 1_000

let busy = false
const lastSync: Partial<Record<RaidRotation, number>> = {}

const who = () => ({ playerId: playerId(), nickname: nickname() ?? DEFAULT_NICKNAME })

/** Cada cuánto se consulta la sala según por dónde va su pelea */
function syncEvery(tr: TabRaid, now: number): number {
  const p = raidProgress(tr, now)
  // Ya es la hora y aún no se tiene la pelea del servidor: se pide enseguida
  if (!p) return fightDue(tr.room, now) ? TAP_RESULT_SYNC_MS : LOBBY_SYNC_MS
  if (p.phase === IncursionPhase.Tap) return TAP_SYNC_MS
  return p.record.outcome === IncursionOutcome.Waiting ? TAP_RESULT_SYNC_MS : FIGHT_SYNC_MS
}

/** Aplica lo que diga el servidor de la sala de la rotación; si ya no la tiene (o no le admite), se sigue en local */
function apply(rotation: RaidRotation, res: RaidResponse) {
  if ('room' in res) act((s) => applyRoomView(s, rotation, res.room, Date.now()))
  else if ('gone' in res) act((s) => dropRoom(s, rotation))
}

async function syncRotation(rotation: RaidRotation, now: number) {
  const s = getState()
  const tr = s.raids[rotation]
  if (!tr || tr.link === RaidLink.Local) return
  const join = joinRequest(s, rotation)
  if (!join && now - (lastSync[rotation] ?? 0) < syncEvery(tr, now)) return
  lastSync[rotation] = now
  try {
    apply(rotation, await postRaid(join ? { ...join, ...who() } : { action: RaidAction.Sync, roomId: tr.room.id, ...who() }))
  } catch (e) {
    if (!(e instanceof RaidApiError)) throw e
    // Sin servidor no se espera más para entrar: la sala se juega en local
    if (join) act((s2) => dropRoom(s2, rotation))
  }
}

/** Avisa al servidor de las salas que se han dejado; si falla, se reintenta más tarde */
async function flushLeaves() {
  for (const roomId of getState().roomsToLeave) {
    await postRaid({ action: RaidAction.Leave, roomId, ...who() })
    act((s) => {
      s.roomsToLeave = s.roomsToLeave.filter((id) => id !== roomId)
    })
  }
}

async function step() {
  if (busy || document.hidden) return
  busy = true
  try {
    await flushLeaves().catch((e: unknown) => {
      if (!(e instanceof RaidApiError)) throw e
    })
    const now = Date.now()
    for (const rotation of RAID_ROTATIONS) await syncRotation(rotation, now)
  } finally {
    busy = false
  }
}

/** Arranca el bucle (una vez, en App); devuelve cómo pararlo */
export function startRaidSync(): () => void {
  const id = setInterval(step, LOOP_MS)
  const onVisible = () => {
    if (document.hidden) return
    for (const r of RAID_ROTATIONS) delete lastSync[r]
    void step()
  }
  document.addEventListener('visibilitychange', onVisible)
  void step()
  return () => {
    clearInterval(id)
    document.removeEventListener('visibilitychange', onVisible)
  }
}

/** Manda una decisión del jugador en la pelea de la rotación y aplica la respuesta; sin conexión, no pasa nada */
async function sendToRoom(rotation: RaidRotation, extra: Pick<RoomRequest, 'action'> & Partial<{ turn: number; moveId: string; target: string | null }>) {
  const tr = getState().raids[rotation]
  if (tr?.link !== RaidLink.Online) return
  try {
    apply(rotation, await postRaid({ ...extra, roomId: tr.room.id, ...who() } as RoomRequest))
  } catch (e) {
    if (!(e instanceof RaidApiError)) throw e
  }
}

/** Ha llegado a los toques en la ventana `turn` */
export const sendRaidTap = (rotation: RaidRotation, turn: number) => sendToRoom(rotation, { action: RaidAction.Tap, turn })
/** Cambia el ataque de su Pokémon y a quién lo dirige, desde la próxima ventana */
export const sendRaidPick = (rotation: RaidRotation, moveId: string, target: string | null) => sendToRoom(rotation, { action: RaidAction.Pick, moveId, target })
/** Ha acertado el toque crítico: su primer golpe del turno siguiente será crítico */
export const sendRaidCrit = (rotation: RaidRotation) => sendToRoom(rotation, { action: RaidAction.Crit })

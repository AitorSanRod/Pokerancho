import { useEffect, useSyncExternalStore } from 'react'
import { DEFAULT_NICKNAME, RaidAction, type RaidBoard } from '../game/raid/online/protocol'
import { nickname, playerId } from './identity'
import { postRaid, RaidApiError } from './raidApi'

// La pestaña Raids según el servidor: cuántos jugadores esperan o luchan contra el jefe de cada rotación, y su hora
// (para contar las esperas igual que él). Solo se consulta con la pestaña en pantalla.

/** Milisegundos reales entre consultas con la pestaña en pantalla */
const BOARD_MS = 20_000
/** Cada cuánto se mira si toca consultar */
const LOOP_MS = 1_000

export interface BoardState {
  board: RaidBoard | null
  /** Hora real (de este dispositivo) a la que llegó `board` */
  receivedAt: number
  /** La última consulta no llegó al servidor */
  failing: boolean
}

let current: BoardState = { board: null, receivedAt: 0, failing: false }
const listeners = new Set<() => void>()
let watchers = 0
let busy = false
let lastAt = 0

function update(patch: Partial<BoardState>) {
  current = { ...current, ...patch }
  listeners.forEach((l) => l())
}

async function step() {
  if (busy || document.hidden || watchers === 0 || Date.now() - lastAt < BOARD_MS) return
  busy = true
  lastAt = Date.now()
  try {
    const res = await postRaid({ action: RaidAction.Board, playerId: playerId(), nickname: nickname() ?? DEFAULT_NICKNAME })
    if ('board' in res) update({ board: res.board, receivedAt: Date.now(), failing: false })
  } catch (e) {
    if (!(e instanceof RaidApiError)) throw e
    update({ failing: true })
  } finally {
    busy = false
  }
}

/** La pestaña Raids está en pantalla: se consulta enseguida y después cada BOARD_MS */
export function useRaidBoard(): BoardState {
  useEffect(() => {
    watchers++
    lastAt = 0
    void step()
    const id = setInterval(step, LOOP_MS)
    return () => {
      watchers--
      clearInterval(id)
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

/** Hora del servidor ahora mismo, según la última respuesta (sin ella, la del dispositivo) */
export const serverNow = (state: BoardState): number => (state.board ? state.board.serverNow + Date.now() - state.receivedAt : Date.now())

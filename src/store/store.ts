import { useSyncExternalStore } from 'react'
import { initialState, type GameState } from '../game/core/state'
import { loadSaved, writeSaved, type SaveStorage } from './persistence'

// El estado vivo de la partida: lo lee la UI con useGame() y solo se cambia con act(). Se guarda en el navegador poco
// después de cada cambio y siempre al ocultar o cerrar la app.

/** Milisegundos reales que se espera tras un cambio para guardar (los cambios seguidos se guardan juntos) */
const SAVE_DELAY_MS = 2_000

/** Hasta startStore(), una partida nueva sin guardar (nadie la ve: la app se pinta después) */
let state: GameState = initialState()
let storage: SaveStorage | null = null
const listeners = new Set<() => void>()
let saveTimer: ReturnType<typeof setTimeout> | undefined
/** Última vez que se jugó la partida guardada, al abrir la app (antes de que el avance sin conexión la ponga en «ahora») */
let playedAtOpen: number | null = null

const notify = () => listeners.forEach((l) => l())

/** Guarda ya (si la partida es de esta pestaña: ver stopSaving) */
export function saveNow() {
  clearTimeout(saveTimer)
  saveTimer = undefined
  if (storage) writeSaved(storage, state)
}

function scheduleSave() {
  saveTimer ??= setTimeout(saveNow, SAVE_DELAY_MS)
}

/** Carga la partida del almacenamiento y empieza a guardarla en él */
export function startStore(from: SaveStorage) {
  storage = from
  state = loadSaved(from)
  playedAtOpen = state.lastTick
  notify()
}

/** Hora real (ms) de la última vez que se jugó antes de abrir la app; null si aún no se ha cargado */
export const openedPlayedAt = (): number | null => playedAtOpen

/** Deja de guardar (otra pestaña se ha quedado con la partida): lo que pase aquí ya no pisa lo suyo */
export function stopSaving() {
  clearTimeout(saveTimer)
  saveTimer = undefined
  storage = null
}

/** El estado de ahora, para quien lo lee fuera de React (ver net/raidSync.ts); se modifica solo con act() */
export function getState(): GameState {
  return state
}

/** Aplica una modificación sobre una copia del estado y notifica a la UI */
export function act<T>(recipe: (draft: GameState) => T): T {
  const draft = structuredClone(state)
  const result = recipe(draft)
  state = draft
  scheduleSave()
  notify()
  return result
}

/** Cambia la partida entera por otra (la de la nube, ver net/cloudSync.ts) y la guarda */
export function replaceState(next: GameState) {
  state = next
  saveNow()
  notify()
}

/** Reiniciar borra también la copia del equipo: se empieza de verdad de cero, con el tutorial */
export function resetGame() {
  replaceState(initialState())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useGame(): GameState {
  return useSyncExternalStore(subscribe, getState)
}

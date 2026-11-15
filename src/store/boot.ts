import type { SaveStorage } from './persistence'
import { saveNow, startStore, stopSaving } from './store'
import { canLockTab, claimTab, takeOverTab } from './tabLock'

// Arranque de la partida en el navegador: qué pestaña juega, de dónde se carga y cuándo se guarda.

/** Sin almacenamiento (algunos modos privados lo niegan), la partida dura lo que la pestaña */
function browserStorage(): SaveStorage {
  try {
    return window.localStorage
  } catch {
    const memory = new Map<string, string>()
    return { getItem: (k) => memory.get(k) ?? null, setItem: (k, v) => void memory.set(k, v) }
  }
}

function startPlaying() {
  startStore(browserStorage())
  window.addEventListener('pagehide', saveNow)
  document.addEventListener('visibilitychange', () => document.hidden && saveNow())
}

/** Otra pestaña se ha quedado con la partida: se guarda lo de aquí y se recarga para enseñar el aviso */
function onTabLost() {
  saveNow()
  stopSaving()
  location.reload()
}

/** Carga la partida si esta pestaña puede jugarla; si no, devuelve cómo quitársela a la otra (ver tabLock.ts) */
export async function bootGame(): Promise<{ playing: true } | { playing: false; playHere: () => Promise<void> }> {
  if (!canLockTab() || (await claimTab(onTabLost))) {
    startPlaying()
    return { playing: true }
  }
  return {
    playing: false,
    playHere: async () => {
      await takeOverTab(onTabLost)
      startPlaying()
    },
  }
}

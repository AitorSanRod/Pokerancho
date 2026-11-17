import { useSyncExternalStore } from 'react'
import { registerSW } from 'virtual:pwa-register'

// Versiones nuevas de la app. El service worker de una versión nueva se queda esperando y aquí se avisa al jugador
// para que recargue (o cierre y abra la app). Con la app abierta mucho rato, se mira cada poco si hay una nueva.

/** Si la versión nueva no ha tomado el control en este tiempo (p. ej. la página aún no la llevaba ninguna), se recarga igual */
const RELOAD_FALLBACK_MS = 3_000
/** Tope de espera a que termine de descargarse una versión aún más nueva antes de activar la que espera (precachea imágenes) */
const INSTALL_WAIT_MS = 20_000
/** Milisegundos reales entre comprobaciones de versión nueva con la app abierta (también se mira al volver a ella) */
const UPDATE_CHECK_MS = 15 * 60_000

interface AppUpdate {
  /** Hay una versión nueva descargada, lista para usarse al recargar */
  ready: boolean
  /** El jugador ha dicho «Más tarde»: se vuelve a avisar la próxima vez que vuelva a la app */
  dismissed: boolean
  /** Ha pulsado «Actualizar»: se busca la versión más reciente y se recarga con ella */
  updating: boolean
}

let update: AppUpdate = { ready: false, dismissed: false, updating: false }
const listeners = new Set<() => void>()
let activate: ((reload?: boolean) => Promise<void>) | null = null
let swRegistration: ServiceWorkerRegistration | null = null

function set(patch: Partial<AppUpdate>) {
  update = { ...update, ...patch }
  listeners.forEach((l) => l())
}

/** Comprueba si hay versión nueva cada UPDATE_CHECK_MS y al volver a la app */
function watchForUpdates(registration: ServiceWorkerRegistration) {
  swRegistration = registration
  const check = () => void registration.update().catch(() => undefined)
  setInterval(check, UPDATE_CHECK_MS)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) return
    check()
    if (update.ready) set({ dismissed: false })
  })
}

/** Registra el service worker (una vez, en main.tsx) */
export function startAppUpdates() {
  activate = registerSW({
    immediate: true,
    onNeedRefresh: () => set({ ready: true, dismissed: false }),
    onRegisteredSW: (_url, registration) => registration && watchForUpdates(registration),
  })
}

/** Espera a que termine de instalarse la versión que se esté descargando (si hay alguna) */
function installed(worker: ServiceWorker | null): Promise<void> {
  if (!worker) return Promise.resolve()
  return new Promise((resolve) => {
    const done = () => {
      worker.removeEventListener('statechange', onChange)
      clearTimeout(timer)
      resolve()
    }
    const onChange = () => worker.state !== 'installing' && done()
    const timer = setTimeout(done, INSTALL_WAIT_MS)
    worker.addEventListener('statechange', onChange)
  })
}

/**
 * Recarga la app entera, con la versión más reciente si la hay. Antes de activar la que espera se busca otra aún más
 * nueva y se deja terminar de instalar: si no, tras varias publicaciones se activaría una intermedia y habría que
 * actualizar dos veces. La partida se guarda al salir de la página (store.ts).
 */
export async function reloadApp() {
  set({ updating: true })
  if (swRegistration) {
    await swRegistration.update().catch(() => undefined)
    await installed(swRegistration.installing)
    if (swRegistration.waiting) {
      void activate?.(true)
      setTimeout(() => location.reload(), RELOAD_FALLBACK_MS)
      return
    }
  }
  location.reload()
}

export const dismissUpdate = () => set({ dismissed: true })

export function useAppUpdate(): AppUpdate {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => update,
  )
}

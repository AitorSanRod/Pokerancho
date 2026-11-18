import { useSyncExternalStore } from 'react'
import { registerSW } from 'virtual:pwa-register'

// Versiones nuevas de la app. El service worker de una versión nueva se queda esperando y aquí se avisa al jugador
// para que recargue (o cierre y abra la app). Con la app abierta mucho rato, se mira cada poco si hay una nueva.
// Tras varias publicaciones seguidas, «Actualizar» espera a que termine de instalarse la más nueva antes de activarla
// y, si aun así aparece otra justo después de recargar, se activa sola: el jugador ya dijo que quería actualizar.

/** Si la versión nueva no ha tomado el control en este tiempo, se recarga igual */
const RELOAD_FALLBACK_MS = 3_000
/** Tope de espera a que termine de instalarse la versión más nueva antes de activar la que espera (precachea imágenes: en el móvil, lento) */
const INSTALL_WAIT_MS = 60_000
/** Milisegundos reales entre comprobaciones de versión nueva con la app abierta (también se mira al volver a ella) */
const UPDATE_CHECK_MS = 15 * 60_000
/** Durante este tiempo tras pulsar «Actualizar», otra versión que aparezca se activa sin volver a preguntar */
const ACCEPTED_UPDATE_MS = 2 * 60_000
/** Dónde se apunta (en esta pestaña) la hora a la que el jugador aceptó actualizar */
const ACCEPTED_KEY = 'pokerancho-update-accepted'
/** Mensaje con el que el service worker en modo `prompt` pasa a activarse */
const SKIP_WAITING = { type: 'SKIP_WAITING' }

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
let swRegistration: ServiceWorkerRegistration | null = null
let reloading = false

function set(patch: Partial<AppUpdate>) {
  update = { ...update, ...patch }
  listeners.forEach((l) => l())
}

function markAccepted() {
  try {
    sessionStorage.setItem(ACCEPTED_KEY, String(Date.now()))
  } catch {
    // Sin almacenamiento: si aparece otra versión, se volverá a avisar
  }
}

function acceptedRecently(): boolean {
  try {
    return Date.now() - Number(sessionStorage.getItem(ACCEPTED_KEY) ?? 0) < ACCEPTED_UPDATE_MS
  } catch {
    return false
  }
}

/** Hay una versión nueva esperando: se avisa, o se activa sola si el jugador acaba de aceptar actualizar */
function onNewVersion() {
  if (acceptedRecently()) void applyLatest()
  else set({ ready: true, dismissed: false })
}

/** Avisa de cada versión que termine de instalarse con la página ya controlada (sin depender de workbox-window, que deja de escuchar tras la primera) */
function watchInstalls(registration: ServiceWorkerRegistration) {
  registration.addEventListener('updatefound', () => {
    const worker = registration.installing
    worker?.addEventListener('statechange', () => {
      if (worker.state === 'installed' && navigator.serviceWorker.controller) onNewVersion()
    })
  })
}

/** Comprueba si hay versión nueva cada UPDATE_CHECK_MS y al volver a la app */
function watchForUpdates(registration: ServiceWorkerRegistration) {
  swRegistration = registration
  watchInstalls(registration)
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
  registerSW({
    immediate: true,
    onNeedRefresh: onNewVersion,
    onRegisteredSW: (_url, registration) => registration && watchForUpdates(registration),
  })
}

/** Espera a que no quede ninguna versión instalándose (puede aparecer otra más nueva mientras tanto), como mucho INSTALL_WAIT_MS */
async function allInstalled(registration: ServiceWorkerRegistration): Promise<void> {
  const deadline = Date.now() + INSTALL_WAIT_MS
  for (let worker = registration.installing; worker && Date.now() < deadline; worker = registration.installing) {
    const installing = worker
    await new Promise<void>((resolve) => {
      const done = () => (installing.removeEventListener('statechange', onChange), clearTimeout(timer), resolve())
      const onChange = () => installing.state !== 'installing' && done()
      const timer = setTimeout(done, deadline - Date.now())
      installing.addEventListener('statechange', onChange)
    })
  }
}

function reloadOnce() {
  if (reloading) return
  reloading = true
  location.reload()
}

/**
 * Recarga con la versión más reciente si la hay: antes de activar la que espera se busca otra aún más nueva y se deja
 * terminar de instalar; si no, tras varias publicaciones se activaría una intermedia y habría que actualizar dos veces
 */
async function applyLatest() {
  set({ updating: true })
  const registration = swRegistration ?? (await navigator.serviceWorker?.getRegistration().catch(() => undefined)) ?? null
  if (registration) {
    await registration.update().catch(() => undefined)
    await allInstalled(registration)
    if (registration.waiting) {
      navigator.serviceWorker.addEventListener('controllerchange', reloadOnce, { once: true })
      registration.waiting.postMessage(SKIP_WAITING)
      setTimeout(reloadOnce, RELOAD_FALLBACK_MS)
      return
    }
  }
  reloadOnce()
}

/** «Actualizar»: recarga la app entera con la versión más reciente. La partida se guarda al salir de la página (store.ts) */
export function reloadApp(): Promise<void> {
  markAccepted()
  return applyLatest()
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

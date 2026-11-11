import { useSyncExternalStore } from 'react'
import { parseServerGifts, type ServerGift } from '../game/collection/serverGifts'
import { account, subscribeAccount } from './account'

// Los regalos del servidor, para todos o para este jugador (worker/serverGifts.ts): se preguntan al abrir la app, al
// entrar o salir de la cuenta y al abrir Notificaciones.
// Sin servidor no hay ninguno.

const SERVER_GIFTS_API = '/api/server-gifts'
const REQUEST_TIMEOUT_MS = 8_000

let gifts: ServerGift[] = []
const listeners = new Set<() => void>()

export async function refreshServerGifts() {
  try {
    const res = await fetch(SERVER_GIFTS_API, { cache: 'no-store', signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) })
    const body = res.ok && res.headers.get('content-type')?.includes('application/json') ? ((await res.json()) as { gifts?: unknown }) : null
    gifts = parseServerGifts(body?.gifts)
  } catch {
    gifts = []
  }
  listeners.forEach((l) => l())
}

/** Pide los regalos ahora y cada vez que se entra en otra cuenta o se sale (los de un jugador van con su sesión); devuelve cómo parar */
export function startServerGifts(): () => void {
  let lastUser: string | null | undefined
  const onAccount = () => {
    const user = account().user?.id ?? null
    if (user !== lastUser) void refreshServerGifts()
    lastUser = user
  }
  onAccount()
  return subscribeAccount(onAccount)
}

export function useServerGifts(): ServerGift[] {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => gifts,
  )
}

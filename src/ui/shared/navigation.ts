import { PushGo } from '../../game/incursion/schedule/schedulePushes'

/** Pestañas del menú inferior */
export type AppTab = 'route' | 'community' | 'ranch' | 'dex' | 'shop'

/** Secciones de la Tienda a las que se puede saltar desde otra pantalla */
export type ShopSpot = 'keys'
/** Subpestañas de Ruta */
export type RouteSpot = 'route' | 'expeditions' | 'tower'
/** Subpestañas de Comunidad */
export type CommunitySpot = 'incursion' | 'raid'
/** Subpestañas de Comunidad › Incursiones a las que se puede saltar (p. ej. desde un aviso); `room`, la sala del checkin */
export type IncursionSpot = 'board' | 'mine' | 'room'

let showTab: ((tab: AppTab) => void) | null = null
let pendingSpot: ShopSpot | null = null

/** El menú inferior se apunta para cambiar de pestaña cuando lo pida otra pantalla */
export function listenTabRequests(onTab: (tab: AppTab) => void): () => void {
  showTab = onTab
  return () => {
    if (showTab === onTab) showTab = null
  }
}

/** Abre la Tienda con esa sección desplegada y a la vista */
export function goToShop(spot: ShopSpot) {
  pendingSpot = spot
  showTab?.('shop')
}

/** Si la Tienda se abrió para enseñar esa sección (no la consume: ver `clearShopSpot`) */
export function isShopSpot(spot: ShopSpot): boolean {
  return pendingSpot === spot
}

/** La sección ya se enseñó */
export function clearShopSpot() {
  pendingSpot = null
}

/**
 * Subpestaña pedida desde otra pantalla: si su pantalla está montada la abre al momento (`listen`); si no, queda
 * pedida hasta que la recoja al montarse (`take`, que la consume)
 */
function spotChannel<T>() {
  let pending: T | null = null
  const listeners = new Set<(spot: T) => void>()
  return {
    request(spot: T) {
      pending = listeners.size > 0 ? null : spot
      listeners.forEach((l) => l(spot))
    },
    take(): T | null {
      const spot = pending
      pending = null
      return spot
    },
    listen(onSpot: (spot: T) => void): () => void {
      listeners.add(onSpot)
      return () => listeners.delete(onSpot)
    },
  }
}

export const routeSpots = spotChannel<RouteSpot>()
export const communitySpots = spotChannel<CommunitySpot>()
export const incursionSpots = spotChannel<IncursionSpot>()

/** Abre Ruta en esa subpestaña */
export function goToRoute(spot: RouteSpot) {
  showTab?.('route')
  routeSpots.request(spot)
}

/** Abre Comunidad › Raids */
export function goToRaids() {
  showTab?.('community')
  communitySpots.request('raid')
}

/** Abre Comunidad › Incursiones en esa subpestaña */
export function goToIncursions(spot: IncursionSpot) {
  showTab?.('community')
  incursionSpots.request(spot)
  communitySpots.request('incursion')
}

/** Subpestaña a la que lleva cada destino de aviso push (`go`) */
const PUSH_SPOTS: Record<PushGo, IncursionSpot> = { [PushGo.Board]: 'board', [PushGo.Mine]: 'mine' }
const isPushGo = (v: unknown): v is PushGo => (Object.values(PushGo) as unknown[]).includes(v)

/** Lleva adonde diga el aviso tocado: al abrir la app (`?go=` en la dirección) o con ella abierta (mensaje del service worker) */
export function listenPushNavigation(): () => void {
  const go = (to: unknown) => isPushGo(to) && goToIncursions(PUSH_SPOTS[to])
  const url = new URL(window.location.href)
  if (url.searchParams.has('go')) {
    go(url.searchParams.get('go'))
    url.searchParams.delete('go')
    window.history.replaceState(window.history.state, '', url)
  }
  const onMessage = (e: MessageEvent) => (e.data as { type?: string; go?: unknown } | null)?.type === 'go' && go((e.data as { go: unknown }).go)
  navigator.serviceWorker?.addEventListener('message', onMessage)
  return () => navigator.serviceWorker?.removeEventListener('message', onMessage)
}

import { PushGo } from '../../game/incursion/schedule/schedulePushes'

/** Pestañas del menú inferior */
export type AppTab = 'route' | 'ranch' | 'shop' | 'gacha' | 'dex'

/** Secciones de la Tienda a las que se puede saltar desde otra pantalla */
export type ShopSpot = 'keys'

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

/** Subpestañas de Ruta › Incursiones a las que se puede saltar (p. ej. desde un aviso) */
export type IncursionSpot = 'board' | 'mine'

let incursionSpot: IncursionSpot | null = null
const incursionListeners = new Set<(spot: IncursionSpot) => void>()

/** La pestaña Ruta y la de Incursiones se apuntan para abrirse cuando lo pida un aviso */
export function listenIncursionRequests(onSpot: (spot: IncursionSpot) => void): () => void {
  incursionListeners.add(onSpot)
  return () => incursionListeners.delete(onSpot)
}

/** Abre Ruta › Incursiones en esa subpestaña */
export function goToIncursions(spot: IncursionSpot) {
  incursionSpot = spot
  showTab?.('route')
  incursionListeners.forEach((l) => l(spot))
}

/** La subpestaña pedida y aún sin enseñar (la consume) */
export function takeIncursionSpot(): IncursionSpot | null {
  const spot = incursionSpot
  incursionSpot = null
  return spot
}

/** Si hay una subpestaña de incursiones pedida y aún sin enseñar */
export const incursionSpotPending = (): boolean => incursionSpot !== null

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

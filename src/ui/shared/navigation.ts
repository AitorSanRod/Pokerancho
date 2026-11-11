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

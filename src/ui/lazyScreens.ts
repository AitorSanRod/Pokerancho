import { lazy, type ComponentType } from 'react'

// Las pantallas de cada pestaña van en ficheros aparte para que la app arranque antes: se pide la que se ve y, en
// cuanto hay un hueco, las demás (el service worker ya las guarda todas para jugar sin conexión).

type Loader<P> = () => Promise<ComponentType<P>>

const loaders: Loader<never>[] = []

function screen<P>(load: Loader<P>) {
  loaders.push(load as Loader<never>)
  return lazy(async () => ({ default: await load() }))
}

export const RouteScreen = screen(() => import('./route/RouteScreen').then((m) => m.RouteScreen))
export const RanchScreen = screen(() => import('./ranch/RanchScreen').then((m) => m.RanchScreen))
export const ShopScreen = screen(() => import('./shop/ShopScreen').then((m) => m.ShopScreen))
export const GachaScreen = screen(() => import('./gacha/GachaScreen').then((m) => m.GachaScreen))
export const DexScreen = screen(() => import('./dex/DexScreen').then((m) => m.DexScreen))
export const StarterScreen = screen(() => import('./starter/StarterScreen').then((m) => m.StarterScreen))

/** Milisegundos tras arrancar en los que se piden las pantallas que aún no se han visto */
const PRELOAD_DELAY_MS = 1_500

/** Pide en segundo plano todas las pantallas, para que cambiar de pestaña no espere; devuelve cómo cancelarlo */
export function preloadScreens(): () => void {
  const id = setTimeout(() => loaders.forEach((load) => void load()), PRELOAD_DELAY_MS)
  return () => clearTimeout(id)
}

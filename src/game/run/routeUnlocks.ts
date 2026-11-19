import { findRoute, routeOpens } from '../../data/maps'
import type { GameState } from '../core/state'

/**
 * Abre las rutas que desbloquean las ya completadas. Completar una ruta abre las siguientes (completeRoute), pero si una
 * siguiente se añade al mapa después, quien ya la había completado no vuelve a cobrar su premio: se abre al cargar
 */
export function unlockReachedRoutes(s: GameState) {
  for (const id of s.completedRoutes) {
    const r = findRoute(id)
    for (const next of r ? routeOpens(r) : []) if (findRoute(next) && !s.unlockedRoutes.includes(next)) s.unlockedRoutes.push(next)
  }
}

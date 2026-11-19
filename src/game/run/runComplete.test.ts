import { describe, expect, it, vi } from 'vitest'
import { route, routeOpens, RouteId } from '../../data/maps'
import { POKEMON } from '../../data/pokemon'
import { initialState } from '../core/state'
import { chooseStarter } from '../core/test-utils'
import { startRun } from './run'
import { completeRoute } from './runComplete'
import { unlockReachedRoutes } from './routeUnlocks'

vi.mock('../../data/maps/kantoMaps', () => import('../core/test-map'))

/** Ruta del mapa de prueba que abre, además, una opcional */
const ROUTE = RouteId.Ruta3

describe('rutas que abre una ruta', () => {
  it('al completarla por primera vez abre la siguiente y las opcionales, y salen en el resumen', () => {
    const s = initialState()
    chooseStarter(s, POKEMON.Charmander)
    s.unlockedRoutes.push(ROUTE)
    startRun(s, ROUTE)
    completeRoute(s, route(ROUTE))
    const opens = routeOpens(route(ROUTE))
    expect(opens).toEqual(route(ROUTE).alsoUnlocks)
    expect(s.unlockedRoutes).toEqual(expect.arrayContaining(opens))
    expect(s.run!.unlocked).toEqual(opens)
  })

  it('al cargar una partida que ya la había completado, también se abren las opcionales añadidas después', () => {
    const s = initialState()
    s.completedRoutes.push(ROUTE)
    unlockReachedRoutes(s)
    expect(s.unlockedRoutes).toEqual(expect.arrayContaining(routeOpens(route(ROUTE))))
  })
})

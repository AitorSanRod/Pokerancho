import { afterEach, describe, expect, it, vi } from 'vitest'
import { GYMS, GymId } from '../../data/gyms'
import { route, RouteId } from '../../data/maps'
import { POKEMON } from '../../data/pokemon'
import { activeMon, initialState } from '../core/state'
import { chooseStarter } from '../core/test-utils'
import { maxHp } from '../team/stats'
import { restartBlocker, startRun, walk } from './run'
import { routeLevelBlocker, routeMaxLevel } from './routeLevelCap'

vi.mock('../../data/maps/kantoMaps', () => import('../core/test-map'))

const ROUTE = RouteId.Ruta1
/** Nivel máximo que se le pone a la ruta de prueba */
const CAP = 10

/** Partida con el inicial al nivel `level` y la ruta de prueba abierta */
function withMonAt(level: number) {
  const s = initialState()
  chooseStarter(s, POKEMON.Squirtle)
  const mon = activeMon(s)!
  mon.level = level
  mon.hp = maxHp(mon)
  s.unlockedRoutes.push(ROUTE)
  return s
}

describe('nivel máximo de una ruta', () => {
  afterEach(() => {
    delete route(ROUTE).maxLevel
  })

  it('sin nivel máximo no hay límite', () => {
    expect(routeMaxLevel(route(ROUTE))).toBeNull()
    const s = withMonAt(100)
    expect(routeLevelBlocker(s, route(ROUTE))).toBeNull()
    startRun(s, ROUTE)
    expect(s.run).not.toBeNull()
  })

  it('sale con su nivel máximo, pero no con uno más', () => {
    route(ROUTE).maxLevel = CAP
    const ok = withMonAt(CAP)
    startRun(ok, ROUTE)
    expect(ok.run).not.toBeNull()
    const tooStrong = withMonAt(CAP + 1)
    expect(routeLevelBlocker(tooStrong, route(ROUTE))).not.toBeNull()
    startRun(tooStrong, ROUTE)
    expect(tooStrong.run).toBeNull()
  })

  it('si sube dentro de la ruta, sigue en ella, pero no puede reiniciarla', () => {
    route(ROUTE).maxLevel = CAP
    const s = withMonAt(CAP)
    startRun(s, ROUTE)
    activeMon(s)!.level = CAP + 1
    walk(s, 1)
    expect(s.run).not.toBeNull()
    expect(restartBlocker(s)).not.toBeNull()
  })

  it('en una ruta de gimnasio cuenta el más bajo de los dos', () => {
    const gymRoute = route(RouteId.GimnasioPlateada)
    const gymCap = GYMS[GymId.Plateada].maxLevel
    expect(routeMaxLevel(gymRoute)).toBe(gymCap)
    expect(routeMaxLevel({ ...gymRoute, maxLevel: gymCap - 1 })).toBe(gymCap - 1)
    expect(routeMaxLevel({ ...gymRoute, maxLevel: gymCap + 1 })).toBe(gymCap)
  })
})

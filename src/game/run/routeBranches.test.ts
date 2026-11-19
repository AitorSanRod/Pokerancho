import { describe, expect, it, vi } from 'vitest'
import { node, pathFrom, route, RouteId } from '../../data/maps'
import { POKEMON } from '../../data/pokemon'
import { initialState } from '../core/state'
import { chooseStarter } from '../core/test-utils'
import { branchSummary, choosePath, forksOn, hasForks, preferredPath } from './routeBranches'
import { restartRun, startRun } from './run'

vi.mock('../../data/maps/kantoMaps', () => import('../core/test-map'))

const FORKED = RouteId.Ruta3
const r = () => route(FORKED)

function readyState() {
  const s = initialState()
  chooseStarter(s, POKEMON.Charmander)
  s.unlockedRoutes.push(FORKED)
  return s
}

describe('forksOn', () => {
  it('da cada cruce del camino con sus caminos, su nombre y el elegido', () => {
    const forks = forksOn(r(), pathFrom(r()))
    expect(forks).toHaveLength(1)
    const [cross] = forks
    expect(cross.at).toBe('a')
    expect(cross.chosen).toBe(node(r(), 'a').next[0].to)
    expect(cross.options.map((o) => o.label)).toEqual(node(r(), 'a').next.map((e) => e.label))
  })

  it('una ruta sin bifurcaciones no tiene cruces', () => {
    expect(hasForks(route(RouteId.PuebloPaleta))).toBe(false)
    expect(forksOn(route(RouteId.PuebloPaleta), pathFrom(route(RouteId.PuebloPaleta)))).toEqual([])
  })
})

describe('branchSummary', () => {
  it('cuenta las paradas de cada camino hasta que se junta con los demás', () => {
    const [grass, trail] = node(r(), 'a').next
    expect(branchSummary(r(), grass)).toMatchObject({ fights: 2, trainers: 0, heals: 0, steps: grass.steps + node(r(), grass.to).next[0].steps })
    expect(branchSummary(r(), trail)).toMatchObject({ fights: 1, trainers: 1, heals: 1 })
  })
})

describe('choosePath', () => {
  it('cambia el camino desde el cruce y sigue siendo un camino completo', () => {
    const other = node(r(), 'a').next[1].to
    const path = choosePath(r(), pathFrom(r()), 'a', other)
    expect(path).toContain(other)
    expect(path[path.length - 1]).toBe(pathFrom(r())[pathFrom(r()).length - 1])
  })

  it('un camino que no sale de ese cruce no cambia nada', () => {
    const path = pathFrom(r())
    expect(choosePath(r(), path, 'a', 'z')).toBe(path)
  })
})

describe('caminos recordados', () => {
  it('al salir por otro camino, la próxima vez sale marcado ese', () => {
    const s = readyState()
    expect(preferredPath(s, r())).toEqual(pathFrom(r()))
    const path = choosePath(r(), pathFrom(r()), 'a', node(r(), 'a').next[1].to)
    startRun(s, FORKED, path)
    expect(s.run!.path).toEqual(path)
    expect(preferredPath(s, r())).toEqual(path)
  })

  it('en una ruta sin bifurcaciones no se apunta nada', () => {
    const s = readyState()
    startRun(s, RouteId.PuebloPaleta)
    expect(s.routePaths).toEqual({})
  })

  it('reiniciar la ruta vuelve a salir por el mismo camino', () => {
    const s = readyState()
    const path = choosePath(r(), pathFrom(r()), 'a', node(r(), 'a').next[1].to)
    startRun(s, FORKED, path)
    restartRun(s)
    expect(s.run!.path).toEqual(path)
  })
})

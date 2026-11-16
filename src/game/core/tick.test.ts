import { describe, expect, it, vi } from 'vitest'
import { legSteps, route, RouteId } from '../../data/maps'
import { POKEMON } from '../../data/pokemon'
import { startRun, walk } from '../run/run'
import { MAX_LEVEL, maxHp } from '../team/stats'
import { startTower } from '../tower/tower'
import { towerMoveChoices } from '../tower/towerMoves'
import { activeMon, initialState, type GameState } from './state'
import { chooseStarter } from './test-utils'
import { tick } from './tick'

vi.mock('../../data/maps/kantoMaps', () => import('./test-map'))
vi.mock('../../data/rankingCuts', () => ({ RANKING_EXTRA_CUTS: [] }))

const ROUTE = RouteId.PuebloPaleta
/** Un rato menor que cualquier combate */
const MS = 100

function withMon(level: number): GameState {
  const s = initialState()
  chooseStarter(s, POKEMON.Charmander)
  const mon = activeMon(s)!
  mon.level = level
  mon.hp = maxHp(mon)
  s.lastTick = 0
  return s
}

/** En la primera parada de la ruta, con el combate recién empezado */
function inRouteBattle(): GameState {
  const s = withMon(MAX_LEVEL)
  startRun(s, ROUTE)
  walk(s, legSteps(route(ROUTE), s.run!.path, 1))
  return s
}

function inTowerBattle(): GameState {
  const s = withMon(MAX_LEVEL)
  startTower(s, towerMoveChoices(activeMon(s)!)[0].id)
  return s
}

describe('tick con combates en espera', () => {
  it('el combate de la ruta no corre mientras la pantalla lo pide, y sigue al soltarlo', () => {
    const s = inRouteBattle()
    const left = s.run!.battleMsLeft
    tick(s, MS, { run: true, tower: false })
    expect(s.run!.battleMsLeft).toBe(left)
    expect(s.lastTick).toBe(MS)
    tick(s, 2 * MS)
    expect(s.run!.battleMsLeft).toBe(left - MS)
  })

  it('el combate de la torre no corre mientras la pantalla lo pide', () => {
    const s = inTowerBattle()
    const left = s.tower!.battleMsLeft
    tick(s, MS, { run: false, tower: true })
    expect(s.tower!.battleMsLeft).toBe(left)
    tick(s, 2 * MS)
    expect(s.tower!.battleMsLeft).toBe(left - MS)
  })

  it('pedir espera sin combate no para la ruta: sigue caminando', () => {
    const s = withMon(MAX_LEVEL)
    startRun(s, ROUTE)
    tick(s, MS, { run: true, tower: true })
    expect(s.run!.steps).toBeGreaterThan(0)
  })
})

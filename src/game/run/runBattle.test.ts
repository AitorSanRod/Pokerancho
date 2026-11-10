import { afterEach, describe, expect, it, vi } from 'vitest'
import { legSteps, NodeKind, route, RouteId, type RouteNode } from '../../data/maps'
import { POKEMON } from '../../data/pokemon'
import { makeFighter } from '../battle/battle'
import { activeMon, initialState } from '../core/state'
import { chooseStarter } from '../core/test-utils'
import { maxHp } from '../team/stats'
import { startRun, walk } from './run'
import { WILD_STAT_MULT } from './runBattle'

vi.mock('../../data/maps/kantoMaps', () => import('../core/test-map'))

const ROUTE = RouteId.PuebloPaleta
const firstWild = (): RouteNode => route(ROUTE).nodes.find((n) => n.kind === NodeKind.Wild)!

/** Llega al primer salvaje de la ruta y devuelve el rival del combate */
function firstRival() {
  const s = initialState()
  chooseStarter(s, POKEMON.Charmander)
  const mon = activeMon(s)!
  mon.hp = maxHp(mon)
  startRun(s, ROUTE)
  walk(s, legSteps(route(ROUTE), s.run!.path, 1))
  return s.run!.lastBattle!.enemy
}

const hpWith = (enemy: ReturnType<typeof firstRival>, statMult: number) =>
  makeFighter('enemy', enemy.speciesId, enemy.level, { statMult }).maxHp

describe('multiplicador de stats del rival', () => {
  afterEach(() => delete firstWild().statMult)

  it('sin statMult en la parada, el salvaje lleva el de por defecto', () => {
    const enemy = firstRival()
    expect(enemy.maxHp).toBe(hpWith(enemy, WILD_STAT_MULT))
  })

  it('la parada puede poner su propio multiplicador', () => {
    const mult = WILD_STAT_MULT * 3
    firstWild().statMult = mult
    const enemy = firstRival()
    expect(enemy.maxHp).toBe(hpWith(enemy, mult))
    expect(enemy.maxHp).toBeGreaterThan(hpWith(enemy, WILD_STAT_MULT))
  })
})

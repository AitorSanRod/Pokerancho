import { describe, expect, it, vi } from 'vitest'
import { RouteId } from '../../data/maps'
import { POKEMON } from '../../data/pokemon'
import { activeMon, initialState } from '../core/state'
import { chooseStarter, seqRng } from '../core/test-utils'
import { maxHp } from '../team/stats'
import {
  advanceExpBoost,
  BOOST_DURATION_MS,
  BOOST_SPAWN_MAX_MS,
  BOOST_SPAWN_MIN_MS,
  BOOST_TAP_EXP,
  BOOST_VISIBLE_MS,
  boostActive,
  catchExpBoost,
} from './expBoost'
import { startRun, tapRun } from './run'

vi.mock('../../data/maps/kantoMaps', () => import('../core/test-map'))

/** Toques seguidos que se prueban */
const TAPS = 10

function onRoute() {
  const s = initialState()
  chooseStarter(s, POKEMON.Charmander)
  const mon = activeMon(s)!
  mon.hp = maxHp(mon)
  startRun(s, RouteId.PuebloPaleta, undefined, seqRng(0))
  return s
}

describe('objeto de la bonificación', () => {
  it('sale caminando cuando toca y se va si no se toca', () => {
    const s = onRoute()
    const run = s.run!
    expect(run.boost.spawnInMs).toBe(BOOST_SPAWN_MIN_MS)
    advanceExpBoost(run, BOOST_SPAWN_MIN_MS - 1)
    expect(run.boost.visibleMs).toBe(0)
    advanceExpBoost(run, 1, seqRng(0.99))
    expect(run.boost.visibleMs).toBe(BOOST_VISIBLE_MS)
    expect(run.boost.spawnInMs).toBeLessThanOrEqual(BOOST_SPAWN_MAX_MS)
    advanceExpBoost(run, BOOST_VISIBLE_MS)
    expect(run.boost.visibleMs).toBe(0)
    expect(catchExpBoost(s)).toBe(false)
  })

  it('tocarlo empieza la bonificación, que se acaba con el tiempo', () => {
    const s = onRoute()
    advanceExpBoost(s.run!, BOOST_SPAWN_MIN_MS)
    expect(catchExpBoost(s)).toBe(true)
    expect(boostActive(s.run!)).toBe(true)
    advanceExpBoost(s.run!, BOOST_DURATION_MS)
    expect(boostActive(s.run!)).toBe(false)
  })
})

describe('toques con la bonificación', () => {
  it('cada toque da su EXP, sin límite', () => {
    const s = onRoute()
    advanceExpBoost(s.run!, BOOST_SPAWN_MIN_MS)
    catchExpBoost(s)
    for (let i = 0; i < TAPS; i++) expect(tapRun(s)).toBe(true)
    expect(s.run!.earned.exp).toBe(TAPS * BOOST_TAP_EXP)
  })

  it('sin bonificación los toques no dan EXP', () => {
    const s = onRoute()
    for (let i = 0; i < TAPS; i++) expect(tapRun(s)).toBe(true)
    expect(s.run!.earned.exp).toBe(0)
  })
})

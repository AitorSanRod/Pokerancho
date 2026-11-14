import { describe, expect, it, vi } from 'vitest'
import { RouteId } from '../../data/maps'
import { POKEMON } from '../../data/pokemon'
import { activeMon, initialState } from '../core/state'
import { chooseStarter, seqRng } from '../core/test-utils'
import { maxHp } from '../team/stats'
import { advanceExpBoost, BOOST_TAP_EXP, BOOST_VISIBLE_MS, boostActive, catchExpBoost, EGG_ROUTE_CHANCE, luckyEggBlocker, spendLuckyEgg } from './expBoost'
import { endRun, restartRun, startRun, tapRun, walk } from './run'

vi.mock('../../data/maps/kantoMaps', () => import('../core/test-map'))

/** Toques seguidos que se prueban */
const TAPS = 10
/** Azar que hace salir el huevo al principio del primer tramo */
const EGG_AT_START = 0
/** Azar por encima de la probabilidad: sin huevo */
const NO_EGG = EGG_ROUTE_CHANCE

function ready() {
  const s = initialState()
  chooseStarter(s, POKEMON.Charmander)
  const mon = activeMon(s)!
  mon.hp = maxHp(mon)
  return s
}

function onRoute(roll = EGG_AT_START) {
  const s = ready()
  startRun(s, RouteId.PuebloPaleta, undefined, seqRng(roll))
  return s
}

describe('Huevo Suerte en ruta', () => {
  it('no sale si el sorteo de la ruta no toca', () => {
    const s = onRoute(NO_EGG)
    walk(s, 1)
    expect(s.run!.boost.spawnAt).toBeNull()
    expect(s.run!.boost.visibleMs).toBe(0)
  })

  it('sale una vez al llegar a su sitio y se va si no se toca', () => {
    const s = onRoute()
    walk(s, 1)
    expect(s.run!.boost.visibleMs).toBe(BOOST_VISIBLE_MS)
    expect(s.run!.boost.spawnAt).toBeNull()
    advanceExpBoost(s.run!, BOOST_VISIBLE_MS)
    expect(catchExpBoost(s)).toBe(false)
    expect(s.luckyEggs).toBe(0)
  })

  it('tocarlo lo guarda en la Mochila sin activar nada en esta ruta', () => {
    const s = onRoute()
    walk(s, 1)
    expect(catchExpBoost(s)).toBe(true)
    expect(s.luckyEggs).toBe(1)
    expect(s.run!.boost.found).toBe(true)
    expect(boostActive(s.run!)).toBe(false)
  })
})

describe('usar el Huevo Suerte', () => {
  it('sin huevos no se puede', () => {
    const s = ready()
    expect(luckyEggBlocker(s)).not.toBeNull()
    expect(spendLuckyEgg(s)).toBe(false)
  })

  it('se gasta y prepara solo la próxima ruta, sin acumular', () => {
    const s = ready()
    s.luckyEggs = 2
    expect(spendLuckyEgg(s)).toBe(true)
    expect(spendLuckyEgg(s)).toBe(false)
    expect(s.luckyEggs).toBe(1)
    startRun(s, RouteId.PuebloPaleta, undefined, seqRng(NO_EGG))
    expect(boostActive(s.run!)).toBe(true)
    expect(s.luckyEggArmed).toBe(false)
    endRun(s)
    startRun(s, RouteId.PuebloPaleta, undefined, seqRng(NO_EGG))
    expect(boostActive(s.run!)).toBe(false)
  })

  it('reiniciar la ruta lo conserva', () => {
    const s = ready()
    s.luckyEggs = 1
    spendLuckyEgg(s)
    startRun(s, RouteId.PuebloPaleta, undefined, seqRng(NO_EGG))
    restartRun(s, seqRng(NO_EGG))
    expect(boostActive(s.run!)).toBe(true)
  })

  it('cada toque da su EXP y los rivales salen al nivel del Pokémon', () => {
    const s = ready()
    s.luckyEggs = 1
    spendLuckyEgg(s)
    activeMon(s)!.level = 30
    startRun(s, RouteId.PuebloPaleta, undefined, seqRng(NO_EGG))
    for (let i = 0; i < TAPS; i++) expect(tapRun(s)).toBe(true)
    expect(s.run!.earned.exp).toBe(TAPS * BOOST_TAP_EXP)
    walk(s, Infinity)
    expect(s.run!.lastBattle!.enemy.level).toBe(30)
  })

  it('sin huevo, los toques no dan EXP', () => {
    const s = onRoute(NO_EGG)
    for (let i = 0; i < TAPS; i++) expect(tapRun(s)).toBe(true)
    expect(s.run!.earned.exp).toBe(0)
  })
})

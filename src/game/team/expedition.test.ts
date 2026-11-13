import { describe, expect, it, vi } from 'vitest'
import { route, RouteId, wildSpecies } from '../../data/maps'
import { POKEMON } from '../../data/pokemon'
import { activeMon, initialState, MonPlace, monPlace } from '../core/state'
import { chooseStarter, readyForExpeditions, seqRng } from '../core/test-utils'
import { runBlocker } from '../run/run'
import {
  advanceExpeditions,
  cancelBlockedExpeditions,
  cancelExpedition,
  collectExpedition,
  EXPEDITION_DURATIONS,
  expeditionBattles,
  expeditionBlocker,
  expeditionsBlocker,
  expeditionRewardMult,
  expeditionRouteBlocker,
  expeditionWinRate,
  isExpeditionDone,
  scaleCount,
  sendExpedition,
} from './expedition'
import { EXPEDITION_FOCUSES, ExpeditionFocus, focusMult } from './expeditionFocus'
import { createMon } from './mons'
import { buyUpgrade, UPGRADES } from './upgrades'

vi.mock('../../data/maps/kantoMaps', () => import('../core/test-map'))

const DURATION = EXPEDITION_DURATIONS[0]
const INVALID_DURATION = Math.max(...EXPEDITION_DURATIONS) + 1
const ROUTE = RouteId.PuebloPaleta

function stateOnExpedition(durationMin = DURATION, focus: ExpeditionFocus = ExpeditionFocus.Exp) {
  const s = initialState()
  chooseStarter(s, POKEMON.Bulbasaur)
  const mon = activeMon(s)!
  readyForExpeditions(s, ROUTE)
  sendExpedition(s, mon.uid, ROUTE, durationMin, focus)
  return { s, mon }
}

describe('expediciones', () => {
  it('no se puede salir de ruta con el Pokémon que está de expedición', () => {
    const { s } = stateOnExpedition()
    expect(runBlocker(s)).toMatch(/expedición/)
  })

  it('solo se puede mandar a una ruta ya completada', () => {
    const s = initialState()
    chooseStarter(s, POKEMON.Bulbasaur)
    const mon = activeMon(s)!
    s.unlockedRoutes.push(ROUTE)
    s.seen.push(...wildSpecies(route(ROUTE)))
    expect(expeditionRouteBlocker(s, ROUTE)).not.toBeNull()
    sendExpedition(s, mon.uid, ROUTE, DURATION, ExpeditionFocus.Exp)
    expect(s.expeditions).toHaveLength(0)
    s.completedRoutes.push(ROUTE)
    expect(expeditionRouteBlocker(s, ROUTE)).toBeNull()
    sendExpedition(s, mon.uid, ROUTE, DURATION, ExpeditionFocus.Exp)
    expect(s.expeditions).toHaveLength(1)
  })

  it('solo acepta las duraciones y los enfoques previstos', () => {
    expect(stateOnExpedition(INVALID_DURATION).s.expeditions).toHaveLength(0)
    expect(stateOnExpedition(DURATION, 'nada' as ExpeditionFocus).s.expeditions).toHaveLength(0)
  })

  it('no se puede recoger antes de tiempo', () => {
    const { s, mon } = stateOnExpedition(DURATION)
    advanceExpeditions(s, DURATION / 2)
    expect(isExpeditionDone(s.expeditions[0])).toBe(false)
    expect(collectExpedition(s, mon.uid)).toBeNull()
  })

  it('al recogerla entrega el premio de los combates ganados y el Pokémon vuelve', () => {
    const { s, mon } = stateOnExpedition(DURATION)
    mon.level = 50
    advanceExpeditions(s, DURATION)
    const money = s.money
    const result = collectExpedition(s, mon.uid, seqRng(0.5))!
    expect(result.battles).toBe(expeditionBattles(DURATION))
    expect(result.wins).toBe(result.battles)
    expect(s.money).toBe(money + result.money)
    // Muy por encima de la ruta: sus rivales no dan EXP
    expect(result.exp).toBe(0)
    expect(s.expeditions).toHaveLength(0)
  })

  it('los salvajes derrotados pueden soltar piezas, que se suman a la colección', () => {
    const { s, mon } = stateOnExpedition(DURATION)
    advanceExpeditions(s, DURATION)
    // Con rng muy bajo se gana cada combate y cada salvaje suelta pieza
    const result = collectExpedition(s, mon.uid, () => 0.001)!
    expect(result.pieces).toHaveLength(result.battles)
    const id = result.pieces[0]
    expect(s.pieces[id]).toBe(result.pieces.filter((p) => p === id).length)
  })

  /** Lo que da una expedición de `duration` con el enfoque `focus`, al nivel de la ruta y con rng muy bajo */
  function collectWith(duration: number, focus: ExpeditionFocus) {
    const { s, mon } = stateOnExpedition(duration, focus)
    // Al nivel de la ruta sus rivales sí dan EXP
    mon.level = route(RouteId.PuebloPaleta).levels[0]
    advanceExpeditions(s, duration)
    // Con rng muy bajo se gana todo, cada salvaje suelta ticket y pieza y la parte decimal siempre suma una unidad más
    return collectExpedition(s, mon.uid, () => 0.001)!
  }

  it.each(EXPEDITION_FOCUSES)('el botín (tickets y piezas) va según el enfoque y no crece con la duración (%s)', (focus) => {
    for (const duration of EXPEDITION_DURATIONS) {
      const result = collectWith(duration, focus)
      const perWin = Math.ceil(focusMult(focus, ExpeditionFocus.Loot))
      expect(result.tickets).toBe(result.battles * perWin)
      expect(result.pieces).toHaveLength(result.battles * perWin)
    }
  })

  it('la EXP y los ₽ crecen con la duración y con su enfoque', () => {
    const duration = EXPEDITION_DURATIONS.at(-1)!
    const forExp = collectWith(duration, ExpeditionFocus.Exp)
    const forMoney = collectWith(duration, ExpeditionFocus.Money)
    expect(forExp.exp).toBeGreaterThan(forMoney.exp)
    expect(forMoney.money).toBeGreaterThan(forExp.money)
    const short = collectWith(EXPEDITION_DURATIONS[0], ExpeditionFocus.Exp)
    expect(forExp.exp / forExp.battles).toBeGreaterThan(short.exp / short.battles)
  })

  it('al elegir botín salen más tickets que con otro enfoque', () => {
    expect(collectWith(DURATION, ExpeditionFocus.Loot).tickets).toBeGreaterThan(collectWith(DURATION, ExpeditionFocus.Exp).tickets)
  })

  it('redondea las unidades: la parte decimal suma una más con su probabilidad y sin decimales no tira', () => {
    expect(scaleCount(2, 1.5, () => 0.4)).toBe(3)
    expect(scaleCount(2, 1.25, () => 0.6)).toBe(2)
    expect(scaleCount(3, 2, () => { throw new Error('no debe tirar') })).toBe(6)
  })

  it('la expedición más larga rinde mucho más por minuto', () => {
    const mults = EXPEDITION_DURATIONS.map(expeditionRewardMult)
    expect(mults).toEqual([...mults].sort((a, b) => a - b))
    expect(mults[mults.length - 1]).toBeGreaterThan(mults[0])
  })

  it('no se puede mandar a una ruta completada si falta por ver alguno de sus salvajes', () => {
    const s = initialState()
    chooseStarter(s, POKEMON.Bulbasaur)
    const mon = activeMon(s)!
    s.completedRoutes.push(ROUTE)
    const [unseen, ...rest] = wildSpecies(route(ROUTE))
    s.seen = s.seen.filter((id) => id !== unseen)
    s.seen.push(...rest)
    expect(expeditionRouteBlocker(s, ROUTE)).toMatch(/1 Pokémon/)
    sendExpedition(s, mon.uid, ROUTE, DURATION, ExpeditionFocus.Exp)
    expect(s.expeditions).toHaveLength(0)
    s.seen.push(unseen)
    expect(expeditionRouteBlocker(s, ROUTE)).toBeNull()
  })

  it('al cargar se quitan las expediciones a rutas con salvajes sin ver y se quedan las demás', () => {
    const { s, mon } = stateOnExpedition()
    cancelBlockedExpeditions(s)
    expect(s.expeditions).toHaveLength(1)
    s.seen = s.seen.filter((id) => id !== wildSpecies(route(ROUTE))[0])
    cancelBlockedExpeditions(s)
    expect(s.expeditions).toHaveLength(0)
    expect(monPlace(s, mon.uid)).toBe(MonPlace.Ranch)
  })

  it('los Pokémon de la Caja no pueden ir de expedición', () => {
    const s = initialState()
    chooseStarter(s, POKEMON.Bulbasaur)
    s.owned[0].ranch = null
    expect(expeditionBlocker(s, s.owned[0].uid)).toMatch(/Caja/)
  })

  it('un Pokémon débil para la ruta tiene menos probabilidad de ganar', () => {
    const { mon } = stateOnExpedition()
    const r = route(RouteId.Ruta1)
    mon.level = 2
    const weak = expeditionWinRate(mon, r)
    mon.level = 20
    expect(weak).toBeLessThan(expeditionWinRate(mon, r))
  })


  it('sin mejoras solo cabe un Pokémon de expedición', () => {
    const { s } = stateOnExpedition()
    const second = createMon(POKEMON.Pidgey, 5)
    s.owned.push(second)
    expect(expeditionBlocker(s, second.uid)).toMatch(/huecos/)
    sendExpedition(s, second.uid, RouteId.PuebloPaleta, DURATION, ExpeditionFocus.Exp)
    expect(s.expeditions).toHaveLength(1)
  })

  it('avisa de que no se puede mandar a nadie sin huecos libres o sin nadie en el rancho', () => {
    const s = initialState()
    chooseStarter(s, POKEMON.Bulbasaur)
    expect(expeditionsBlocker(s)).toBeNull()
    s.owned[0].ranch = null
    expect(expeditionsBlocker(s)).toMatch(/rancho/)
    const { s: full } = stateOnExpedition()
    full.owned.push(createMon(POKEMON.Pidgey, 5))
    expect(expeditionsBlocker(full)).toMatch(/huecos/)
  })

  it('la mejora de espacio permite uno más', () => {
    const { s } = stateOnExpedition()
    const second = createMon(POKEMON.Pidgey, 5)
    s.owned.push(second)
    s.money = UPGRADES.expeditionSlots.prices[0]
    buyUpgrade(s, 'expeditionSlots')
    sendExpedition(s, second.uid, RouteId.PuebloPaleta, DURATION, ExpeditionFocus.Exp)
    expect(s.expeditions).toHaveLength(2)
  })

  it('cancelarla hace volver al Pokémon al rancho sin ningún premio', () => {
    const { s, mon } = stateOnExpedition(DURATION)
    advanceExpeditions(s, DURATION / 2)
    const before = { money: s.money, tickets: s.tickets, pieces: { ...s.pieces }, seen: [...s.seen], exp: mon.exp, level: mon.level }
    expect(cancelExpedition(s, mon.uid)).toBe(true)
    expect(s.expeditions).toHaveLength(0)
    expect(monPlace(s, mon.uid)).toBe(MonPlace.Ranch)
    expect({ money: s.money, tickets: s.tickets, pieces: s.pieces, seen: s.seen, exp: mon.exp, level: mon.level }).toEqual(before)
  })

  it('una expedición que ya ha vuelto no se cancela: se recoge', () => {
    const { s, mon } = stateOnExpedition(DURATION)
    advanceExpeditions(s, DURATION)
    expect(cancelExpedition(s, mon.uid)).toBe(false)
    expect(s.expeditions).toHaveLength(1)
  })
})

import { afterEach, describe, expect, it, vi } from 'vitest'
import { legSteps, NodeKind, route, RouteId, type RouteNode } from '../../data/maps'
import { POKEMON } from '../../data/pokemon'
import { makeFighter } from '../battle/battle'
import { expReward } from '../battle/rewards'
import type { Rng } from '../core/random'
import { activeMon, initialState } from '../core/state'
import { chooseStarter } from '../core/test-utils'
import { maxHp } from '../team/stats'
import { startRun, walk } from './run'
import { WILD_STAT_MULT } from './runBattle'
import { SHINY_FOE_CHANCE, SHINY_FOE_EXP_MULT, SHINY_FOE_STAT_BONUS } from './shinyFoe'

vi.mock('../../data/maps/kantoMaps', () => import('../core/test-map'))

const ROUTE = RouteId.PuebloPaleta
const firstWild = (): RouteNode => route(ROUTE).nodes.find((n) => n.kind === NodeKind.Wild)!

/** Rng siempre por encima de la probabilidad shiny: el rival sale normal */
const notShiny: Rng = () => 0.99
/** Rng siempre por debajo de la probabilidad shiny: el rival sale shiny */
const shinyRng: Rng = () => SHINY_FOE_CHANCE / 2

/** Partida en el primer salvaje de la ruta, con el combate empezado; `seen`, especies ya vistas antes de salir */
function atFirstWild(seen: number[] = [], rng: Rng = notShiny) {
  const s = initialState()
  chooseStarter(s, POKEMON.Charmander)
  s.seen.push(...seen)
  const mon = activeMon(s)!
  mon.hp = maxHp(mon)
  startRun(s, ROUTE)
  walk(s, legSteps(route(ROUTE), s.run!.path, 1), rng)
  return s
}

/** Llega al primer salvaje de la ruta y devuelve el rival del combate */
const firstRival = (rng: Rng = notShiny) => atFirstWild([], rng).run!.lastBattle!.enemy

describe('especies descubiertas en la ruta', () => {
  it('un rival que no se había visto queda como descubierto', () => {
    const s = atFirstWild()
    const id = s.run!.lastBattle!.enemy.speciesId
    expect(s.run!.earned.discovered).toEqual([id])
    expect(s.seen).toContain(id)
  })

  it('un rival ya visto no cuenta como descubierto', () => {
    const r = route(ROUTE)
    const s = atFirstWild([...r.encounters, ...(firstWild().encounters ?? [])].map((e) => e.speciesId))
    expect(s.run!.earned.discovered).toEqual([])
  })
})

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

describe('rival shiny', () => {
  afterEach(() => delete firstWild().statMult)

  it('con el rng por encima de la probabilidad sale normal', () => {
    expect(firstRival().shiny).toBeUndefined()
  })

  it('suma su bono al multiplicador de la parada', () => {
    const enemy = firstRival(shinyRng)
    expect(enemy.shiny).toBe(true)
    expect(enemy.maxHp).toBe(hpWith(enemy, WILD_STAT_MULT + SHINY_FOE_STAT_BONUS))
  })

  it('también sobre el multiplicador propio de la parada', () => {
    const mult = WILD_STAT_MULT * 3
    firstWild().statMult = mult
    const enemy = firstRival(shinyRng)
    expect(enemy.maxHp).toBe(hpWith(enemy, mult + SHINY_FOE_STAT_BONUS))
  })

  it('al ganarle da la EXP multiplicada', () => {
    const { rewards, outcome, enemy, player } = atFirstWild([], shinyRng).run!.lastBattle!
    expect(rewards.exp).toBe(outcome === 'win' ? expReward(enemy.level, player.level) * SHINY_FOE_EXP_MULT : 0)
  })
})

import { describe, expect, it, vi } from 'vitest'
import { preEvolutionsOf } from '../../data/evolutions'
import { route, RouteId, starLevel, starMinHp, starNoPassives, starPassives, starSeeAll, starType, starWith, type Route, type RouteStarGoals } from '../../data/maps'
import { POKEMON } from '../../data/pokemon'
import { species } from '../../data/species'
import { activeMon, initialState, type GameState } from '../core/state'
import { chooseStarter } from '../core/test-utils'
import { endRun, startRun } from './run'
import { completeRoute } from './runComplete'
import {
  hasStar,
  hpPercent,
  brokenStars,
  meetsNow,
  routeSpecies,
  routeStars,
  starCount,
  starPrize,
  StarGoal,
  strongestRivalLevel,
  TRAINER_ROUTE_STAR_GAP,
  type RouteStar,
} from './routeStars'

vi.mock('../../data/maps/kantoMaps', () => import('../core/test-map'))

const ROUTE = RouteId.Ruta3
const r = () => route(ROUTE)
/** La ruta de prueba con otras dos estrellas */
const withStars = (stars: RouteStarGoals): Route => ({ ...r(), stars })

/** Sale a la ruta con el Pokémon a ese nivel y la completa (sin combates: solo lo que se mira al salir y al acabar) */
function completeAt(level: number, s: GameState = initialState(), on: Route = r()): GameState {
  if (!activeMon(s)) chooseStarter(s, POKEMON.Charmander)
  activeMon(s)!.level = level
  s.unlockedRoutes.push(ROUTE)
  endRun(s)
  startRun(s, ROUTE)
  completeRoute(s, on)
  return s
}

const starOf = (on: Route, goal: StarGoal): RouteStar => routeStars(on).find((st) => st.goal === goal)!
const levelStar = () => starOf(r(), StarGoal.LevelCap) as RouteStar & { level: number }

describe('routeStars', () => {
  it('sin estrellas elegidas: completarla, sin pasar del nivel de su rival más fuerte y verlas todas', () => {
    expect(routeStars(r()).map((st) => st.goal)).toEqual([StarGoal.Complete, StarGoal.LevelCap, StarGoal.SeeAll])
    expect(levelStar().level).toBe(strongestRivalLevel(r()))
  })

  it('el rival más fuerte cuenta los salvajes con su bono de nivel, los jefes y los entrenadores de cualquier camino', () => {
    const wildTop = r().levels[1] + Math.max(...r().nodes.map((n) => n.levelBonus ?? 0))
    expect(strongestRivalLevel(r())).toBeGreaterThanOrEqual(wildTop)
  })

  it('en una ruta de solo líderes la tercera es completarla con unos niveles menos', () => {
    const [, second, third] = routeStars(route(RouteId.GimnasioPlateada)) as (RouteStar & { level: number })[]
    expect(third).toMatchObject({ goal: StarGoal.LevelCap, level: second.level - TRAINER_ROUTE_STAR_GAP })
  })

  it('con estrellas elegidas, la primera sigue siendo completarla y cada una tiene su propia clave', () => {
    const stars = routeStars(withStars([starPassives('water', 'grass'), starPassives('grass', 'water')]))
    expect(stars[0].goal).toBe(StarGoal.Complete)
    expect(stars[1].key).toBe(stars[2].key)
    expect(routeStars(withStars([starMinHp(40), starMinHp(50)]))[1].key).not.toBe(routeStars(withStars([starMinHp(40), starMinHp(50)]))[2].key)
  })
})

describe('claimRouteStars', () => {
  it('la primera vez, con un Pokémon de nivel bajo, da las estrellas de completar y de nivel con su premio', () => {
    const s = initialState()
    const before = s.tickets
    completeAt(levelStar().level, s)
    expect(s.run!.earned.stars).toEqual([StarGoal.Complete, levelStar().key])
    expect(starCount(s, r())).toBe(2)
    expect(s.tickets - before).toBe(r().reward.tickets + 2 * starPrize(r()).tickets)
  })

  it('con un Pokémon por encima del nivel, la de nivel no sale', () => {
    const s = completeAt(levelStar().level + 1)
    expect(hasStar(s, r(), levelStar())).toBe(false)
  })

  it('con todas sus especies vistas sale la de verlas; una estrella ya conseguida no se vuelve a pagar', () => {
    const s = initialState()
    chooseStarter(s, POKEMON.Charmander)
    s.seen.push(...routeSpecies(r()))
    completeAt(levelStar().level, s)
    expect(hasStar(s, r(), starOf(r(), StarGoal.SeeAll))).toBe(true)
    const tickets = s.tickets
    completeAt(levelStar().level, s)
    expect(s.run!.earned.stars).toEqual([])
    expect(s.tickets).toBe(tickets)
  })

  it('la de especie vale con ella o con una de sus evoluciones, no con otra', () => {
    const evolved = POKEMON.Charmeleon
    const on = withStars([starWith(preEvolutionsOf(evolved)[0]), starWith(POKEMON.Bulbasaur)])
    const s = initialState()
    chooseStarter(s, evolved)
    completeAt(1, s, on)
    expect(hasStar(s, on, routeStars(on)[1])).toBe(true)
    expect(hasStar(s, on, routeStars(on)[2])).toBe(false)
  })

  it('la de tipo mira los tipos del Pokémon', () => {
    const own = species(POKEMON.Charmander).types[0]
    const on = withStars([starType(own), starType(own === 'water' ? 'grass' : 'water')])
    const s = completeAt(1, initialState(), on)
    expect(hasStar(s, on, routeStars(on)[1])).toBe(true)
    expect(hasStar(s, on, routeStars(on)[2])).toBe(false)
  })

  it('las de pasivas miran las de rancho con las que ha luchado en toda la ruta', () => {
    const on = withStars([starNoPassives(), starPassives('water')])
    const s = initialState()
    chooseStarter(s, POKEMON.Charmander)
    s.unlockedRoutes.push(ROUTE)
    startRun(s, ROUTE)
    s.run!.passiveTypes = ['water']
    completeRoute(s, on)
    expect(hasStar(s, on, starOf(on, StarGoal.NoRanchPassives))).toBe(false)
    expect(hasStar(s, on, starOf(on, StarGoal.OnlyPassiveTypes))).toBe(true)
  })

  it('solo con pasivas de unos tipos pide tener alguna; sin ninguna sale la de sin pasivas', () => {
    const on = withStars([starNoPassives(), starPassives('water')])
    const s = completeAt(1, initialState(), on)
    expect(hasStar(s, on, starOf(on, StarGoal.NoRanchPassives))).toBe(true)
    expect(hasStar(s, on, starOf(on, StarGoal.OnlyPassiveTypes))).toBe(false)
  })

  it('la de PS mira los más bajos a los que ha llegado en la ruta', () => {
    const on = withStars([starMinHp(50), starMinHp(90)])
    const s = initialState()
    chooseStarter(s, POKEMON.Charmander)
    s.unlockedRoutes.push(ROUTE)
    startRun(s, ROUTE)
    expect(s.run!.lowestHp).toBe(hpPercent(activeMon(s)!))
    s.run!.lowestHp = 60
    completeRoute(s, on)
    expect(s.run!.earned.stars).toEqual([StarGoal.Complete, routeStars(on)[1].key])
  })
})

describe('meetsNow', () => {
  it('dice si el compañero cumple ya lo que se sabe antes de salir; lo de al acabar, null', () => {
    const s = initialState()
    chooseStarter(s, POKEMON.Charmander)
    activeMon(s)!.level = 10
    const on = withStars([starLevel(10), starSeeAll()])
    expect(meetsNow(s, routeStars(on)[1])).toBe(true)
    expect(meetsNow(s, routeStars(withStars([starLevel(9), starMinHp(10)]))[1])).toBe(false)
    expect(meetsNow(s, routeStars(on)[2])).toBeNull()
  })
})

describe('quien ya había completado la ruta', () => {
  it('empieza sin estrellas y consigue la de completarla al volver a pasarla, sin el premio de la ruta', () => {
    const s = initialState()
    s.completedRoutes.push(ROUTE)
    expect(starCount(s, r())).toBe(0)
    const before = s.tickets
    completeAt(levelStar().level + 1, s)
    expect(s.run!.earned.stars).toEqual([StarGoal.Complete])
    expect(s.tickets - before).toBe(starPrize(r()).tickets)
  })
})

describe('brokenStars', () => {
  /** La ruta del mapa de prueba con estrellas de PS y de pasivas de agua */
  const CHALLENGE = RouteId.Ruta1

  function onRoute(routeId: string, level = 1): GameState {
    const s = initialState()
    chooseStarter(s, POKEMON.Charmander)
    activeMon(s)!.level = level
    s.unlockedRoutes.push(routeId)
    startRun(s, routeId)
    return s
  }

  it('las de PS y pasivas se pierden en cuanto pasa, no antes', () => {
    const s = onRoute(CHALLENGE)
    expect(brokenStars(s)).toEqual([])
    s.run!.passiveTypes = ['water']
    expect(brokenStars(s)).toEqual([])
    s.run!.passiveTypes = ['water', 'fire']
    s.run!.lowestHp = 0
    expect(brokenStars(s).map((st) => st.goal)).toEqual([StarGoal.MinHp, StarGoal.OnlyPassiveTypes])
  })

  it('la de nivel ya está perdida al salir con más nivel; la de verlas todas, nunca', () => {
    const s = onRoute(ROUTE, levelStar().level + 1)
    expect(brokenStars(s).map((st) => st.key)).toEqual([levelStar().key])
  })

  it('una estrella ya conseguida no se avisa', () => {
    const s = onRoute(ROUTE, levelStar().level + 1)
    s.routeStars[ROUTE] = [levelStar().key]
    expect(brokenStars(s)).toEqual([])
  })
})

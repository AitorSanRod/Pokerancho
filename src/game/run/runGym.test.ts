import { describe, expect, it, vi } from 'vitest'
import { GYMS, GymId } from '../../data/gyms'
import { route, RouteId } from '../../data/maps'
import { POKEMON } from '../../data/pokemon'
import { activeMon, initialState, type GameState } from '../core/state'
import { chooseStarter, seqRng } from '../core/test-utils'
import { MAX_LEVEL, maxHp } from '../team/stats'
import { expeditionRouteBlocker } from '../team/expedition'
import { towerMove, towerMoveChoices } from '../tower/towerMoves'
import { BATTLE_EVENT_MS } from './battleTimeline'
import { advanceRun, startRun, walk } from './run'
import { routeGym, routeGyms } from './runGym'
import { routeLevelBlocker } from './routeLevelCap'
import { defaultRouteMove, pickRouteMove } from './runMove'

vi.mock('../../data/maps/kantoMaps', () => import('../core/test-map'))
/** Nivel del primer Pokémon del líder de prueba */
const { TANK_LEVEL } = vi.hoisted(() => ({ TANK_LEVEL: 50 }))
// Gimnasio de prueba: un primer Pokémon duro (para combates de varios ataques) y otro flojo, a los que gana un nivel máximo
vi.mock('../../data/gyms', async (original) => {
  const real = await original<typeof import('../../data/gyms')>()
  const { Badge } = await import('../../data/badges')
  const { POKEMON: P } = await import('../../data/pokemon')
  const team = [
    { speciesId: P.Snorlax, level: TANK_LEVEL },
    { speciesId: P.Pidgey, level: 2 },
  ]
  return { ...real, GYMS: { ...real.GYMS, [real.GymId.Plateada]: { leader: 'Líder', badge: Badge.Boulder, maxLevel: 100, team } } }
})

const ROUTE = RouteId.GimnasioPlateada
const GYM = GYMS[GymId.Plateada]
/** Pasos de sobra para llegar a la parada del gimnasio */
const FAR = 10_000

/** Partida con el inicial al nivel `level`, en la ruta del gimnasio y ya delante del líder */
function atTheGym(level: number, starter: number = POKEMON.Squirtle, rng = seqRng(0.5)) {
  const s = initialState()
  chooseStarter(s, starter)
  const mon = activeMon(s)!
  mon.level = level
  mon.hp = maxHp(mon)
  s.unlockedRoutes.push(ROUTE)
  startRun(s, ROUTE, undefined, rng)
  walk(s, FAR, rng)
  return s
}

/** Acaba el combate en curso (sin pasar al siguiente tramo) */
const finishBattle = (s: GameState, rng = seqRng(0.5)) => advanceRun(s, s.run!.battleMsLeft, rng)

const playerAttacks = (s: GameState) => s.run!.lastBattle!.events.filter((e) => e.kind === 'attack' && e.side === 'player')

describe('gimnasio', () => {
  it('el líder saca su equipo uno tras otro, como entrenador', () => {
    const s = atTheGym(MAX_LEVEL)
    expect(routeGym(route(ROUTE))).toBe(GYM)
    expect(routeGyms(route(ROUTE))).toEqual([GYM])
    GYM.team.forEach((foe, i) => {
      expect(s.run!.gym!.index).toBe(i)
      expect(s.run!.lastBattle!.enemy.speciesId).toBe(foe.speciesId)
      expect(s.run!.lastBattle!.events[0].text).toContain(GYM.leader)
      if (i < GYM.team.length - 1) finishBattle(s)
    })
  })

  it('al ganar al último, la medalla solo la primera vez y la ruta completada', () => {
    const s = atTheGym(MAX_LEVEL)
    advanceRun(s, Number.MAX_SAFE_INTEGER)
    expect(s.run!.phase).toBe('complete')
    expect(s.badges).toEqual([GYM.badge])
    expect(s.run!.earned.badge).toBe(GYM.badge)
    const again = atTheGym(MAX_LEVEL)
    again.badges = [...s.badges]
    advanceRun(again, Number.MAX_SAFE_INTEGER)
    expect(again.badges).toEqual([GYM.badge])
    expect(again.run!.earned.badge).toBeNull()
  })

  it('un líder sin medalla (el Alto Mando) se gana sin dar ninguna', () => {
    const badge = GYM.badge
    delete GYM.badge
    try {
      const s = atTheGym(MAX_LEVEL)
      advanceRun(s, Number.MAX_SAFE_INTEGER)
      expect(s.run!.phase).toBe('complete')
      expect(s.badges).toEqual([])
      expect(s.run!.earned.badge).toBeNull()
    } finally {
      GYM.badge = badge
    }
  })

  it('si cae, no hay medalla', () => {
    const s = atTheGym(1)
    advanceRun(s, Number.MAX_SAFE_INTEGER)
    expect(s.run!.phase).toBe('fainted')
    expect(s.badges).toEqual([])
  })

  it('el Pokémon del líder que gana al jugador no se descubre', () => {
    const s = atTheGym(1)
    const first = GYM.team[0].speciesId
    expect(s.seen).not.toContain(first)
    advanceRun(s, Number.MAX_SAFE_INTEGER)
    expect(s.seen).not.toContain(first)
  })

  it('vencido el equipo del líder, todos sus Pokémon se descubren', () => {
    const s = atTheGym(MAX_LEVEL)
    advanceRun(s, Number.MAX_SAFE_INTEGER)
    expect(s.seen).toEqual(expect.arrayContaining(GYM.team.map((f) => f.speciesId)))
  })

  it('lucha con el ataque elegido de la ruta; sin elegir, con el de salida', () => {
    const s = atTheGym(MAX_LEVEL)
    const mon = activeMon(s)!
    expect(s.run!.lastBattle!.player.move).toEqual(towerMove(mon, defaultRouteMove(mon)))
    const other = initialState()
    chooseStarter(other, POKEMON.Squirtle)
    activeMon(other)!.level = MAX_LEVEL
    const chosen = towerMoveChoices(activeMon(other)!).find((m) => m.id !== defaultRouteMove(activeMon(other)!))!.id
    other.unlockedRoutes.push(ROUTE)
    startRun(other, ROUTE)
    pickRouteMove(other, chosen, other.lastTick)
    walk(other, FAR, seqRng(0.5))
    expect(other.run!.lastBattle!.player.move).toEqual(towerMove(activeMon(other)!, chosen))
  })

  it('cambiar de ataque contra el líder vale desde su siguiente ataque; lo ya visto no cambia', () => {
    // Bulbasaur tiene más de un ataque de daño
    const s = atTheGym(MAX_LEVEL, POKEMON.Bulbasaur)
    const mon = activeMon(s)!
    const [first, second] = playerAttacks(s)
    expect(second).toBeDefined()
    const before = s.run!.lastBattle!.events.indexOf(first)
    const firstAt = s.run!.lastBattle!.events.slice(0, before + 1).reduce((ms, e) => ms + BATTLE_EVENT_MS[e.kind], 0)
    s.run!.battleMsLeft -= firstAt
    const other = towerMoveChoices(mon).find((m) => m.id !== s.run!.moveId)!.id
    pickRouteMove(s, other, s.lastTick)
    const [againFirst, againSecond] = playerAttacks(s)
    expect(againFirst.text).toBe(first.text)
    expect(againSecond.move).toEqual(towerMove(mon, other))
  })

  it('un Pokémon por encima de su nivel máximo no puede entrar', () => {
    const s = initialState()
    chooseStarter(s, POKEMON.Squirtle)
    s.unlockedRoutes.push(ROUTE)
    activeMon(s)!.level = GYM.maxLevel
    expect(routeLevelBlocker(s, route(ROUTE))).toBeNull()
    activeMon(s)!.level = GYM.maxLevel + 1
    expect(routeLevelBlocker(s, route(ROUTE))).not.toBeNull()
    startRun(s, ROUTE)
    expect(s.run).toBeNull()
  })

  it('a los gimnasios no se va de expedición', () => {
    const s = atTheGym(MAX_LEVEL)
    s.completedRoutes.push(ROUTE)
    expect(expeditionRouteBlocker(s, ROUTE)).not.toBeNull()
  })
})

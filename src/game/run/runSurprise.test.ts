import { describe, expect, it, vi } from 'vitest'
import { legSteps, node, route, RouteId } from '../../data/maps'
import { POKEMON } from '../../data/pokemon'
import { activeMon, initialState, type GameState } from '../core/state'
import { chooseStarter, seqRng } from '../core/test-utils'
import { maxHp } from '../team/stats'
import { advanceRun, startRun, walk } from './run'
import { currentTrainer } from './runTrainer'
import {
  CHEST_PIECES,
  CHEST_STOP_MS,
  CHEST_TICKETS,
  HORDE_SIZE,
  RARE_LEVEL_BONUS,
  RIVAL_LEVEL_BONUS,
  RIVAL_TEAM_SIZE,
  rollSurprise,
  SURPRISE_CHANCE,
  SURPRISE_WEIGHTS,
  SurpriseKind,
} from './runSurprise'

vi.mock('../../data/maps/kantoMaps', () => import('../core/test-map'))

const ROUTE = RouteId.Ruta3
const r = () => route(ROUTE)
/** Sin shiny ni premios al azar en los combates */
const CALM = seqRng(0.5)

/** Valor de rng que saca esa sorpresa en el sorteo por pesos */
function rollFor(kind: SurpriseKind): number {
  const entries = Object.entries(SURPRISE_WEIGHTS) as [SurpriseKind, number][]
  const total = entries.reduce((sum, [, w]) => sum + w, 0)
  const before = entries.slice(0, entries.findIndex(([k]) => k === kind)).reduce((sum, [, w]) => sum + w, 0)
  return (before + SURPRISE_WEIGHTS[kind] / 2) / total
}

/** En la ruta ya completada, sale con esa sorpresa en la primera parada de salvajes y llega a ella */
function atSurprise(kind: SurpriseKind): GameState {
  const s = initialState()
  chooseStarter(s, POKEMON.Charmander)
  const mon = activeMon(s)!
  mon.level = 60
  mon.hp = maxHp(mon)
  s.unlockedRoutes.push(ROUTE)
  s.completedRoutes.push(ROUTE)
  startRun(s, ROUTE, undefined, seqRng(0.99))
  s.run!.surprise = rollSurprise(s, r(), s.run!.path, seqRng(0, 0, rollFor(kind), 0))
  walk(s, legSteps(r(), s.run!.path, 1), CALM)
  return s
}

describe('rollSurprise', () => {
  it('solo sale en una ruta ya completada', () => {
    const s = initialState()
    expect(rollSurprise(s, r(), ['s', 'a', 'h1', 'h2', 'z'], seqRng(0))).toBeNull()
    s.completedRoutes.push(ROUTE)
    expect(rollSurprise(s, r(), ['s', 'a', 'h1', 'h2', 'z'], seqRng(0))).not.toBeNull()
  })

  it('con la probabilidad de SURPRISE_CHANCE, y siempre en una parada de salvajes del camino', () => {
    const s = initialState()
    s.completedRoutes.push(ROUTE)
    const path = ['s', 'a', 't', 'p', 'z']
    expect(rollSurprise(s, r(), path, seqRng(SURPRISE_CHANCE))).toBeNull()
    const surprise = rollSurprise(s, r(), path, seqRng(0, 0.99, 0))!
    expect(node(r(), path[surprise.stop]).kind).toBe('wild')
  })

  it('una ruta sin paradas de salvajes no tiene sorpresa', () => {
    const s = initialState()
    s.completedRoutes.push(RouteId.GimnasioPlateada)
    expect(rollSurprise(s, route(RouteId.GimnasioPlateada), ['s', 'g'], seqRng(0))).toBeNull()
  })
})

describe('parada sorpresa', () => {
  it('el cofre suma su botín, para al Pokémon un rato sin combatir y después sigue', () => {
    const s = atSurprise(SurpriseKind.Chest)
    const run = s.run!
    expect(run.battleMsLeft).toBe(0)
    expect(run.chest).toMatchObject({ tickets: CHEST_TICKETS, msLeft: CHEST_STOP_MS })
    expect(run.earned.pieces).toHaveLength(CHEST_PIECES)
    expect(run.earned.money).toBe(run.chest!.money)
    expect(run.earned.tickets).toBe(CHEST_TICKETS)
    advanceRun(s, CHEST_STOP_MS)
    expect(run.chest).toBeNull()
    expect(run.stop).toBe(1)
  })

  it('la horda saca HORDE_SIZE salvajes seguidos en la misma parada', () => {
    const s = atSurprise(SurpriseKind.Horde)
    const run = s.run!
    for (let i = 0; i < HORDE_SIZE + 2 && run.battleMsLeft > 0; i++) advanceRun(s, run.battleMsLeft, CALM)
    expect(run.earned.battles).toBe(HORDE_SIZE)
    expect(run.earned.wins).toBe(HORDE_SIZE)
    expect(run.stop).toBe(1)
  })

  it('el Pokémon poco común es la especie menos probable de la parada, con más nivel y ticket seguro', () => {
    const s = atSurprise(SurpriseKind.Rare)
    const rarest = [...r().encounters].sort((a, b) => a.chance - b.chance)[0].speciesId
    const enemy = s.run!.lastBattle!.enemy
    expect(enemy.speciesId).toBe(rarest)
    expect(enemy.level).toBeGreaterThanOrEqual(r().levels[0] + RARE_LEVEL_BONUS)
    expect(s.run!.battleSetup!.prize.piece).toBe(true)
  })

  it('el entrenador rival reta con salvajes de la parada al nivel máximo de la ruta', () => {
    const s = atSurprise(SurpriseKind.Rival)
    const trainer = currentTrainer(s)!
    expect(trainer).toBe(s.run!.surprise!.trainer)
    expect(trainer.team).toHaveLength(RIVAL_TEAM_SIZE)
    expect(trainer.team.every((m) => m.level === r().levels[1] + RIVAL_LEVEL_BONUS)).toBe(true)
    expect(s.run!.trainer).toMatchObject({ index: 0 })
  })
})

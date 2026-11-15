import { describe, expect, it, vi } from 'vitest'
import { RouteId } from '../../data/maps'
import { POKEMON } from '../../data/pokemon'
import { activeMon, initialState, type GameState } from '../core/state'
import { chooseStarter, seqRng } from '../core/test-utils'
import { towerMove, towerMoveChoices } from '../tower/towerMoves'
import { playSetup } from './battleReplay'
import { BATTLE_EVENT_MS, battleDuration } from './battleTimeline'
import { restartRun, startRun, walk } from './run'
import { defaultRouteMove, pickRouteMove } from './runMove'

vi.mock('../../data/maps/kantoMaps', () => import('../core/test-map'))

/** Pasos de sobra para llegar a la primera parada */
const FAR = 10_000

/** Partida en una ruta normal con un inicial que tiene más de un ataque de daño */
function onRoute(): GameState {
  const s = initialState()
  chooseStarter(s, POKEMON.Bulbasaur)
  startRun(s, RouteId.PuebloPaleta)
  return s
}

/** Otro ataque de daño que sabe el Pokémon, distinto del elegido */
const otherMove = (s: GameState) => towerMoveChoices(activeMon(s)!).find((m) => m.id !== s.run!.moveId)!.id

const playerAttacks = (s: GameState) => s.run!.lastBattle!.events.filter((e) => e.kind === 'attack' && e.side === 'player')

/** El combate en curso, con un rival que no cae, vuelto a jugar desde el principio: dura varios ataques */
function longBattle(s: GameState) {
  const { battleSetup: setup, lastBattle: record } = s.run!
  setup!.enemy.hp = setup!.enemy.maxHp = Number.MAX_SAFE_INTEGER
  Object.assign(record!, playSetup(setup!))
  s.run!.battleMsLeft = battleDuration(record!)
}

describe('ataque de la ruta', () => {
  it('sale con el de salida y lucha con él contra los salvajes', () => {
    const s = onRoute()
    const mon = activeMon(s)!
    expect(s.run!.moveId).toBe(defaultRouteMove(mon))
    walk(s, FAR, seqRng(0.5))
    expect(s.run!.lastBattle!.player.move).toEqual(towerMove(mon, defaultRouteMove(mon)))
  })

  it('el elegido antes de un combate vale para él y se conserva al reiniciar la ruta', () => {
    const s = onRoute()
    const chosen = otherMove(s)
    pickRouteMove(s, chosen, s.lastTick)
    walk(s, FAR, seqRng(0.5))
    expect(s.run!.lastBattle!.player.move).toEqual(towerMove(activeMon(s)!, chosen))
    restartRun(s)
    expect(s.run!.moveId).toBe(chosen)
  })

  it('en pleno combate vale desde su siguiente ataque; lo ya visto no cambia', () => {
    const s = onRoute()
    walk(s, FAR, seqRng(0.5))
    longBattle(s)
    const [first, second] = playerAttacks(s)
    expect(second).toBeDefined()
    const events = s.run!.lastBattle!.events
    const firstAt = events.slice(0, events.indexOf(first) + 1).reduce((ms, e) => ms + BATTLE_EVENT_MS[e.kind], 0)
    s.run!.battleMsLeft -= firstAt
    const chosen = otherMove(s)
    pickRouteMove(s, chosen, s.lastTick)
    const [againFirst, againSecond] = playerAttacks(s)
    expect(againFirst.text).toBe(first.text)
    expect(againSecond.move).toEqual(towerMove(activeMon(s)!, chosen))
  })

  it('no admite un ataque que no sabe ni elegir sin ruta', () => {
    const s = onRoute()
    const moveId = s.run!.moveId
    pickRouteMove(s, 'no-existe', s.lastTick)
    expect(s.run!.moveId).toBe(moveId)
    s.run = null
    pickRouteMove(s, moveId, s.lastTick)
    expect(s.run).toBeNull()
  })
})

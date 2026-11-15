import { describe, expect, it, vi } from 'vitest'
import { SPECIES } from '../../data/species'
import { activeMon, initialState, type GameState } from '../core/state'
import { chooseStarter, seqRng } from '../core/test-utils'
import { POKEMON } from '../../data/pokemon'
import { playSetup } from '../run/battleReplay'
import { BATTLE_EVENT_MS, battleDuration } from '../run/battleTimeline'
import { MAX_LEVEL, maxHp } from '../team/stats'
import { advanceTower, startTower, TOWER_FLOOR_GAP_MS } from './tower'
import { setTowerMove } from './towerMoveSwitch'
import { towerMove, towerMoveChoices } from './towerMoves'

vi.mock('../../data/maps/kantoMaps', () => import('../core/test-map'))
vi.mock('../../data/rankingCuts', () => ({ RANKING_EXTRA_CUTS: [] }))

/** En la torre, al nivel máximo, con una especie que tiene más de un ataque de daño */
function climbing() {
  const s = initialState()
  chooseStarter(s, POKEMON.Charmander)
  const mon = activeMon(s)!
  mon.level = MAX_LEVEL
  mon.speciesId = SPECIES.find((sp) => towerMoveChoices({ ...mon, speciesId: sp.id }).length > 1)!.id
  mon.hp = maxHp(mon)
  const [first, other] = towerMoveChoices(mon)
  startTower(s, first.id, seqRng(0.3))
  return { s, mon, first, other }
}

const playerAttacks = (s: GameState) => s.tower!.lastBattle!.events.filter((e) => e.kind === 'attack' && e.side === 'player')

/** El piso en curso, con un rival que no cae, vuelto a jugar desde el principio: dura varios ataques */
function longFloor(s: GameState) {
  const t = s.tower!
  t.battle!.enemy.hp = t.battle!.enemy.maxHp = Number.MAX_SAFE_INTEGER
  Object.assign(t.lastBattle!, playSetup(t.battle!))
  t.battleMsLeft = battleDuration(t.lastBattle!)
}

describe('cambiar el ataque de la torre', () => {
  it('en pleno combate vale desde su siguiente ataque; lo ya visto no cambia', () => {
    const { s, mon, other } = climbing()
    longFloor(s)
    const [first, second] = playerAttacks(s)
    expect(second).toBeDefined()
    const events = s.tower!.lastBattle!.events
    s.tower!.battleMsLeft -= events.slice(0, events.indexOf(first) + 1).reduce((ms, e) => ms + BATTLE_EVENT_MS[e.kind], 0)
    setTowerMove(s, other.id, s.lastTick)
    expect(s.tower!.moveId).toBe(other.id)
    const [againFirst, againSecond] = playerAttacks(s)
    expect(againFirst.text).toBe(first.text)
    expect(againSecond.move).toEqual(towerMove(mon, other.id))
  })

  it('entre pisos, vale para el siguiente', () => {
    const { s, other } = climbing()
    advanceTower(s, s.tower!.battleMsLeft, seqRng(0.3))
    setTowerMove(s, other.id, s.lastTick)
    advanceTower(s, TOWER_FLOOR_GAP_MS, seqRng(0.3))
    expect(s.tower!.lastBattle!.player.move!.id).toBe(other.id)
  })

  it('solo acepta ataques que sabe y mientras sube', () => {
    const s = initialState()
    chooseStarter(s, POKEMON.Charmander)
    const move = towerMoveChoices(activeMon(s)!)[0].id
    setTowerMove(s, move, s.lastTick)
    expect(s.tower).toBeNull()
    startTower(s, move, seqRng(0.3))
    setTowerMove(s, 'no-existe', s.lastTick)
    expect(s.tower!.moveId).toBe(move)
  })
})

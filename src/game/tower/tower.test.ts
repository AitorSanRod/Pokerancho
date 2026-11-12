import { describe, expect, it } from 'vitest'
import { POKEMON } from '../../data/pokemon'
import { activeMon, initialState } from '../core/state'
import { chooseStarter, seqRng } from '../core/test-utils'
import { MAX_LEVEL } from '../team/stats'
import { advanceTower, leaveTower, startTower, TOWER_HEAL_EVERY, TOWER_LEVELS_PER_FLOOR, TOWER_START_LEVEL, towerLevel } from './tower'

/** Tiempo de sobra para muchos combates */
const LONG_MS = 60 * 60 * 1000

function withMon(level: number) {
  const s = initialState()
  chooseStarter(s, POKEMON.Charmander)
  activeMon(s)!.level = level
  return s
}

describe('torre infinita', () => {
  it('el rival sube de nivel piso a piso', () => {
    expect(towerLevel(1)).toBe(TOWER_START_LEVEL)
    expect(towerLevel(3)).toBe(TOWER_START_LEVEL + 2 * TOWER_LEVELS_PER_FLOOR)
  })

  it('sin compañero no se sale', () => {
    const s = initialState()
    startTower(s)
    expect(s.tower).toBeNull()
  })

  it('empieza en el primer piso con un combate', () => {
    const s = withMon(MAX_LEVEL)
    startTower(s, seqRng(0.3))
    expect(s.tower).toMatchObject({ floor: 1, over: false })
    expect(s.tower!.battleMsLeft).toBeGreaterThan(0)
  })

  it('sube mientras gana y, al caer, se acaba y queda el récord', () => {
    const s = withMon(TOWER_START_LEVEL)
    startTower(s, seqRng(0.3, 0.6, 0.9))
    advanceTower(s, LONG_MS, seqRng(0.3, 0.6, 0.9))
    expect(s.tower!.over).toBe(true)
    expect(s.towerBest).toBe(s.tower!.floor - 1)
    expect(s.towerBest).toBeGreaterThanOrEqual(0)
  })

  it('tras el piso de cura, el siguiente empieza con todos los PS', () => {
    const s = withMon(MAX_LEVEL)
    startTower(s, seqRng(0.5))
    s.tower!.floor = TOWER_HEAL_EVERY
    advanceTower(s, s.tower!.battleMsLeft, seqRng(0.5))
    const next = s.tower!.lastBattle!
    expect(s.tower!.floor).toBe(TOWER_HEAL_EVERY + 1)
    expect(next.events[0].playerHp).toBe(next.player.maxHp)
  })

  it('salir de la torre la quita', () => {
    const s = withMon(MAX_LEVEL)
    startTower(s)
    leaveTower(s)
    expect(s.tower).toBeNull()
  })
})

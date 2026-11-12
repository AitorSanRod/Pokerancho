import { describe, expect, it, vi } from 'vitest'
import { POKEMON } from '../../data/pokemon'
import { makeFighter, type BattleRecord } from '../battle/battle'
import { CRIT_EARLY_MS, CRIT_LATE_MS, CRIT_RING_MS } from '../battle/critTiming'
import { initialState } from '../core/state'
import { BATTLE_EVENT_MS, battleDuration } from './battleTimeline'
import { battleElapsed, playSetup, ringAt, ringResult, ringTimes, tapBattle, type RouteBattleSetup } from './tapCrit'

vi.mock('../../data/maps/kantoMaps', () => import('../core/test-map'))

const LEVEL = 30
/** Semillas que se prueban para ver que unos ataques llevan anillo y otros no */
const SEEDS = 30

/** Un combate igualado (para que haya varios ataques del jugador), aún sin toques */
const setup = (seed: number): RouteBattleSetup => ({
  seed,
  player: makeFighter('player', POKEMON.Bulbasaur, LEVEL),
  enemy: makeFighter('enemy', POKEMON.Squirtle, LEVEL),
  prize: { money: 10, tickets: 0, exp: 5, piece: false },
  taps: [],
})

const record = (st: RouteBattleSetup, crits: number[] = []): BattleRecord => {
  const r = playSetup(st, crits)
  const side = { speciesId: 1, name: '', level: LEVEL, maxHp: 1 }
  return { player: side, enemy: side, events: r.events, outcome: r.outcome, boss: false, rewards: { money: 0, tickets: 0, exp: 0, piece: false, moneyLost: 0 } }
}

const playerAttacks = (rec: BattleRecord) => rec.events.filter((e) => e.kind === 'attack' && e.side === 'player' && !e.struggle).length

/** Primera semilla cuyo combate tiene algún anillo */
function withRing(): RouteBattleSetup {
  for (let seed = 1; ; seed++) if (ringTimes(record(setup(seed)), seed).length > 0) return setup(seed)
}

describe('anillos', () => {
  it('solo algunos ataques del jugador lo llevan, y siempre los mismos para la misma semilla', () => {
    const counts = Array.from({ length: SEEDS }, (_, i) => {
      const rec = record(setup(i + 1))
      return [ringTimes(rec, i + 1).length, playerAttacks(rec)]
    })
    expect(counts.some(([rings, attacks]) => rings < attacks)).toBe(true)
    expect(counts.some(([rings]) => rings > 0)).toBe(true)
    const st = withRing()
    expect(ringTimes(record(st), st.seed)).toEqual(ringTimes(record(st), st.seed))
  })

  it('se ve mientras se cierra', () => {
    const st = withRing()
    const rec = record(st)
    const ring = ringTimes(rec, st.seed)[0]
    expect(ringAt(rec, st.seed, ring.at)).toEqual(ring)
    expect(ringAt(rec, st.seed, ring.at - CRIT_RING_MS - 1)?.ordinal).not.toBe(ring.ordinal)
  })

  it('un solo toque a tiempo es crítico; antes o después, o dos toques, fallo', () => {
    const st = withRing()
    const ring = ringTimes(record(st), st.seed)[0]
    expect(ringResult(ring, [])).toBeNull()
    expect(ringResult(ring, [ring.at])).toBe('crit')
    expect(ringResult(ring, [ring.at - CRIT_EARLY_MS])).toBe('crit')
    expect(ringResult(ring, [ring.at + CRIT_LATE_MS])).toBe('crit')
    expect(ringResult(ring, [ring.at - CRIT_EARLY_MS - 1])).toBe('fail')
    expect(ringResult(ring, [ring.at + CRIT_LATE_MS + 1])).toBe('fail')
    expect(ringResult(ring, [ring.at - CRIT_RING_MS + 1, ring.at])).toBe('fail')
    expect(ringResult(ring, [ring.at, ring.at + BATTLE_EVENT_MS.attack - 1])).toBe('fail')
  })
})

describe('repetir el combate con el crítico', () => {
  it('lo anterior al golpe no cambia y el golpe sale crítico', () => {
    const st = setup(1)
    const plain = playSetup(st, []).events
    const withCrit = playSetup(st, [1]).events
    const hit = plain.findIndex((e, i) => i > 0 && plain[i - 1].kind === 'attack' && plain[i - 1].side === 'player' && e.kind === 'hit')
    expect(withCrit.slice(0, hit)).toEqual(plain.slice(0, hit))
    expect(withCrit[hit]).toMatchObject({ kind: 'hit', crit: true, tapCrit: true })
    expect(withCrit[hit].enemyHp).toBeLessThan(plain[hit].enemyHp)
  })
})

describe('tapBattle', () => {
  function inBattle() {
    const s = initialState()
    const st = withRing()
    const rec = record(st)
    s.lastTick = 0
    s.run = { battleSetup: st, lastBattle: rec, battleMsLeft: battleDuration(rec) } as never
    return { s, ring: ringTimes(rec, st.seed)[0] }
  }

  it('sin combate no hace nada', () => {
    expect(tapBattle(initialState(), 0)).toBe(false)
  })

  it('un toque a tiempo vuelve a jugar el combate con el crítico y sigue en el mismo momento', () => {
    const { s, ring } = inBattle()
    expect(tapBattle(s, ring.at)).toBe(true)
    expect(s.run!.lastBattle!.events.some((e) => e.tapCrit)).toBe(true)
    expect(battleElapsed(s, ring.at)).toBe(ring.at)
  })

  it('un segundo toque antes del golpe lo quita', () => {
    const { s, ring } = inBattle()
    tapBattle(s, ring.at)
    tapBattle(s, ring.at + CRIT_LATE_MS + 1)
    expect(s.run!.lastBattle!.events.some((e) => e.tapCrit)).toBe(false)
  })
})

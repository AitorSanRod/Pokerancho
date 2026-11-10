import { describe, expect, it, vi } from 'vitest'
import { POKEMON } from '../../../data/pokemon'
import { seqRng } from '../../core/test-utils'
import { incursionProgress, IncursionPhase } from '../activeIncursion'
import { EventKind } from '../events'
import { TEST_INCURSION } from '../incursion-test-mock'
import { freshMember } from '../party'
import { repertoire } from '../repertoire'
import { takeBossDamage } from './bossDamage'
import { advanceShared, formGroup, voteShared, type SharedIncursion } from './sharedIncursion'

/** La incursión de prueba con todos sus rivales como jefes */
vi.mock('../../../data/incursions', async () => {
  const mock = await import('../incursion-test-mock')
  const asBoss = (r: (typeof mock.TEST_INCURSION.rooms)[number]) => ('foes' in r ? { ...r, foes: r.foes.map((f) => ({ ...f, boss: {} })) } : r)
  return { ...mock, incursion: () => ({ ...mock.TEST_INCURSION, rooms: mock.TEST_INCURSION.rooms.map(asBoss) }) }
})

const NOW = 1_000_000
const LEVEL = 20
/** Paso (ms) con el que se adelanta la hora hasta el final */
const STEP_MS = 1000
const MOVE = repertoire(POKEMON.Snorlax, LEVEL)[0].id

const group = () =>
  formGroup(
    'abcdef12',
    TEST_INCURSION.id,
    [0, 1].map((n) => ({
      playerId: `jugador-${n}`,
      nickname: `J${n}`,
      member: freshMember({ id: `mon${n}`, speciesId: POKEMON.Snorlax, level: LEVEL, stars: 0, moveId: MOVE }),
      joinedAt: NOW,
    })),
    NOW,
    seqRng(0.5),
  )

/** Adelanta la hora hasta que la incursión termina y dice cuándo */
function finish(g: SharedIncursion): number {
  let now = NOW
  while (incursionProgress(g, now).phase !== IncursionPhase.Finished) advanceShared(g, (now += STEP_MS))
  return now
}

/** Daño de cada Pokémon a los jefes, sumado a mano de los golpes */
function hitsOnBosses(g: SharedIncursion, now: number): Record<string, number> {
  const events = incursionProgress(g, now).record.legs.flatMap((l) => l.events)
  const bosses = new Set(events.flatMap((e) => e.fighters ?? []).filter((f) => f.boss).map((f) => f.id))
  const total: Record<string, number> = {}
  for (const e of events) if (e.kind === EventKind.Hit && e.actor && bosses.has(e.target!)) total[e.actor] = (total[e.actor] ?? 0) + e.amount!
  return total
}

describe('daño de una incursión para el ranking', () => {
  it('mientras dura no se apunta nada', () => {
    const g = group()
    expect(takeBossDamage(g, NOW)).toEqual([])
    expect(g.damagePending).toBe(true)
  })

  it('al terminar se apunta el daño de los jugadores a los jefes (sin bots), una sola vez', () => {
    const g = group()
    const end = finish(g)
    const hits = hitsOnBosses(g, end)
    const tally = takeBossDamage(g, end)
    expect(tally.map((d) => d.playerId)).toEqual(['jugador-0', 'jugador-1'].filter((_, i) => hits[`mon${i}`] > 0))
    for (const d of tally) expect(d).toEqual({ playerId: d.playerId, uid: d.uid, speciesId: POKEMON.Snorlax, damage: Math.round(hits[d.uid]) })
    expect(tally.length).toBeGreaterThan(0)
    expect(takeBossDamage(g, end)).toEqual([])
  })

  it('al retirarse cuenta lo hecho hasta ese momento', () => {
    const g = group()
    voteShared(g, 'jugador-0', true, NOW)
    expect(takeBossDamage(g, NOW)).toEqual([])
    expect(g.damagePending).toBe(false)
  })

  it('un grupo de antes, sin la marca, no cuenta', () => {
    const g = group()
    delete g.damagePending
    expect(takeBossDamage(g, finish(g))).toEqual([])
  })
})

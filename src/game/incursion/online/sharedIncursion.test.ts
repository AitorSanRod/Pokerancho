import { describe, expect, it, vi } from 'vitest'
import { POKEMON } from '../../../data/pokemon'
import { seqRng } from '../../core/test-utils'
import { incursionProgress, IncursionPhase, recordOf, REGROUP_MS } from '../activeIncursion'
import { TEST_INCURSION } from '../incursion-test-mock'
import { LegOutcome } from '../incursionLeg'
import { eventStartMs, legDuration } from '../incursionTimeline'
import { TAP_WINDOW_MS } from '../tapWindow'
import { PARTY_SIZE, freshMember } from '../party'
import { repertoire } from '../repertoire'
import { votesNeeded } from '../retreatVote'
import { QUEUE_MAX_MS } from './protocol'
import { advanceShared, chooseShared, formGroup, groupView, pickGroup, pickShared, readyShared, TAP_CLOSE_DELAY_MS, tapShared, voteShared, type Queued } from './sharedIncursion'

vi.mock('../../../data/incursions', () => import('../incursion-test-mock'))

const NOW = 1_000_000
const LEVEL = 20
const MOVES = repertoire(POKEMON.Snorlax, LEVEL)

const queued = (n: number, joinedAt = NOW): Queued => ({
  playerId: `jugador-${n}`,
  nickname: `J${n}`,
  member: freshMember({ id: `mon${n}`, speciesId: POKEMON.Snorlax, level: LEVEL, stars: 0, moveId: MOVES[0].id }),
  joinedAt,
})
const group = (players = 2) => formGroup('abcdef12', TEST_INCURSION.id, Array.from({ length: players }, (_, i) => queued(i)), NOW, seqRng(0.5))
/** Cierra sin toques las ventanas del primer tramo y dice cuándo acaba (llega la sala de reorganizar) */
function regroupAt(g: ReturnType<typeof group>): number {
  for (;;) {
    const played = recordOf(g).legs[0]
    const end = g.legStarts[0] + legDuration(played)
    if (played.outcome !== LegOutcome.Waiting) return end
    advanceShared(g, end)
  }
}

/** Hora a la que acaba la ventana de toques en la que está parado el primer tramo */
function windowEndAt(g: ReturnType<typeof group>): number {
  const played = recordOf(g).legs[0]
  return g.legStarts[0] + eventStartMs(played, played.events.length - 1) + TAP_WINDOW_MS
}

describe('cola de incursión', () => {
  it('con cinco esperando se forma el grupo con los cinco primeros', () => {
    const waiting = Array.from({ length: PARTY_SIZE + 1 }, (_, i) => queued(i))
    expect(pickGroup(waiting, NOW)?.map((q) => q.playerId)).toEqual(waiting.slice(0, PARTY_SIZE).map((q) => q.playerId))
  })

  it('con menos, espera hasta que el primero lleva el tiempo máximo', () => {
    const waiting = [queued(0), queued(1)]
    expect(pickGroup(waiting, NOW + QUEUE_MAX_MS - 1)).toBeNull()
    expect(pickGroup(waiting, NOW + QUEUE_MAX_MS)).toHaveLength(2)
  })

  it('un Pokémon repetido no entra dos veces en el mismo grupo', () => {
    const twin = { ...queued(1), member: queued(0).member }
    expect(pickGroup([queued(0), twin], NOW + QUEUE_MAX_MS)).toHaveLength(1)
  })

  it('el grupo se completa con bots y cada jugador tiene su sitio', () => {
    const g = group(2)
    expect(g.members).toHaveLength(PARTY_SIZE)
    expect(groupView(g, 'jugador-1', NOW)?.you).toBe('mon1')
    expect(groupView(g, 'otro', NOW)).toBeNull()
  })
})

describe('grupo de incursión', () => {
  it('al acabar el plazo de reorganizar, empieza el tramo siguiente con lo elegido', () => {
    const g = group()
    const at = regroupAt(g)
    chooseShared(g, 'jugador-0', MOVES[1].id, at)
    chooseShared(g, 'jugador-1', 'no-existe', at)
    advanceShared(g, at + REGROUP_MS)
    expect(g.legStarts).toEqual([NOW, at + REGROUP_MS])
    expect(g.orders[1].moves).toEqual({ mon0: MOVES[1].id })
  })

  it('cuando todos dan a seguir, el tramo empieza ya', () => {
    const g = group()
    const at = regroupAt(g)
    readyShared(g, 'jugador-0', at)
    expect(g.legStarts).toHaveLength(1)
    readyShared(g, 'jugador-1', at + 1)
    expect(g.legStarts).toEqual([NOW, at + 1])
  })

  it('la ventana de toques se cierra un poco después de acabar, con los que avisaron a tiempo', () => {
    const g = group(3)
    const end = windowEndAt(g)
    tapShared(g, 'jugador-0', 0, 0, end - 1)
    tapShared(g, 'otro', 0, 0, end - 1)
    tapShared(g, 'jugador-1', 0, 5, end - 1)
    advanceShared(g, end)
    expect(g.orders[0].turns).toEqual([])
    advanceShared(g, end + TAP_CLOSE_DELAY_MS)
    expect(g.orders[0].turns[0].boosted).toEqual(['mon0'])
    tapShared(g, 'jugador-2', 0, 0, end + TAP_CLOSE_DELAY_MS + 1)
    expect(g.tapPending).toEqual([])
  })

  it('el cambio de ataque entra en la ventana que se cierra; uno que no conoce, no', () => {
    const g = group(2)
    const end = windowEndAt(g)
    pickShared(g, 'jugador-0', { moveId: MOVES[1].id, target: null }, end - 1)
    pickShared(g, 'jugador-1', { moveId: 'no-existe', target: null }, end - 1)
    expect(groupView(g, 'jugador-0', end)?.yourPick).toEqual({ moveId: MOVES[1].id, target: null })
    advanceShared(g, end + TAP_CLOSE_DELAY_MS)
    expect(g.orders[0].turns[0].picks).toEqual({ mon0: { moveId: MOVES[1].id, target: null } })
    expect(g.pickPending).toEqual({})
  })

  it('con los votos necesarios, la incursión acaba en ese momento; los votos se pueden quitar', () => {
    const g = group(3)
    voteShared(g, 'jugador-0', true, NOW)
    voteShared(g, 'jugador-0', false, NOW)
    expect(g.votes).toEqual([])
    for (let i = 0; i < votesNeeded(3); i++) voteShared(g, `jugador-${i}`, true, NOW + 10)
    expect(g.retreat).toEqual({ leg: 0, atMs: 10 })
    expect(incursionProgress(g, NOW + 10).phase).toBe(IncursionPhase.Finished)
  })
})

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POKEMON } from '../../data/pokemon'
import { seqRng } from '../core/test-utils'
import { initialState, type GameState } from '../core/state'
import { createMon } from '../team/mons'
import { recordOf } from './activeIncursion'
import { TEST_INCURSION } from './incursion-test-mock'
import { advanceIncursion, startIncursion } from './incursionGame'
import { pendingOrders, setIncursionPick } from './incursionPicks'
import { legDuration } from './incursionTimeline'
import { repertoire } from './repertoire'

vi.mock('../../data/incursions', () => import('./incursion-test-mock'))

const NOW = 1_000_000
const LEVEL = 20
let s: GameState
let uid: string
const moves = repertoire(POKEMON.Snorlax, LEVEL)

beforeEach(() => {
  s = initialState()
  const mon = createMon(POKEMON.Snorlax, LEVEL, 0)
  s.owned.push(mon)
  uid = mon.uid
  s.incursionKeys[TEST_INCURSION.id] = 1
  startIncursion(s, TEST_INCURSION.id, uid, moves[0].id, NOW, seqRng(0.5))
})

describe('elegir ataque en plena pelea', () => {
  it('solo un ataque que conoce; queda pendiente hasta la próxima ventana', () => {
    expect(setIncursionPick(s, { moveId: 'no-existe', target: null }, NOW)).toBe(false)
    expect(setIncursionPick(s, { moveId: moves[1].id, target: 'foe-0-0' }, NOW)).toBe(true)
    expect(pendingOrders(s.incursion!, true)).toEqual({ boosted: [uid], picks: { [uid]: { moveId: moves[1].id, target: 'foe-0-0' } } })
  })

  it('al cerrarse la ventana entra en sus órdenes y deja de estar pendiente', () => {
    setIncursionPick(s, { moveId: moves[1].id, target: null }, NOW)
    const played = recordOf(s.incursion!).legs[0]
    advanceIncursion(s, s.incursion!.legStarts[0] + legDuration(played))
    expect(s.incursion!.orders[0].turns[0].picks[uid]).toEqual({ moveId: moves[1].id, target: null })
    expect(s.incursion!.pendingPick).toBeNull()
  })
})

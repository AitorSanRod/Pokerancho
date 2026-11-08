import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POKEMON } from '../../../data/pokemon'
import { seqRng } from '../../core/test-utils'
import { initialState, MonPlace, monPlace, type GameState } from '../../core/state'
import { createMon } from '../../team/mons'
import { advanceIncursion } from '../incursionGame'
import { TEST_INCURSION } from '../incursion-test-mock'
import { keysOf } from '../keys'
import { repertoire } from '../repertoire'
import { applyGroupView, dropGroup, enterQueue, leaveQueue, playQueueLocally, queueRequest } from './linkedIncursion'
import { formGroup, groupView } from './sharedIncursion'

vi.mock('../../../data/incursions', () => import('../incursion-test-mock'))

const ID = TEST_INCURSION.id
const NOW = 1_000_000
const SERVER_NOW = 5_000
let s: GameState
let uid: string
let move: string

beforeEach(() => {
  s = initialState()
  const mon = createMon(POKEMON.Snorlax, 20, 0)
  s.owned.push(mon)
  uid = mon.uid
  move = repertoire(mon.speciesId, mon.level)[0].id
  s.incursionKeys[ID] = 1
})

/** Lo que diría el servidor de un grupo con este jugador dentro */
function serverView() {
  const member = queueRequest(s)!.member
  const g = formGroup('abcdef12', ID, [{ playerId: 'yo-mismo', nickname: 'Yo', member, joinedAt: SERVER_NOW }], SERVER_NOW, seqRng(0.5))
  return groupView(g, 'yo-mismo', SERVER_NOW)!
}

describe('incursión con servidor', () => {
  it('al buscar grupo el Pokémon queda apartado, pero la llave no se gasta', () => {
    enterQueue(s, ID, uid, move, NOW)
    expect(monPlace(s, uid)).toBe(MonPlace.Incursion)
    expect(keysOf(s, ID)).toBe(1)
    expect(queueRequest(s)?.member).toMatchObject({ id: uid, moveId: move })
  })

  it('al formarse el grupo gasta la llave, entra y pasa las horas al reloj del móvil', () => {
    enterQueue(s, ID, uid, move, NOW)
    expect(applyGroupView(s, serverView(), NOW)).toBe(true)
    expect(keysOf(s, ID)).toBe(0)
    expect(s.incursionQueue).toBeNull()
    expect(s.incursion?.legStarts).toEqual([NOW])
    expect(s.incursion?.online?.groupId).toBe('abcdef12')
  })

  it('no hace caso de un grupo que no es el suyo', () => {
    enterQueue(s, ID, uid, move, NOW)
    const view = serverView()
    leaveQueue(s)
    expect(applyGroupView(s, view, NOW)).toBe(false)
    expect(s.incursion).toBeNull()
  })

  it('con grupo, los tramos los decide el servidor; si lo olvida, sigue en local', () => {
    enterQueue(s, ID, uid, move, NOW)
    applyGroupView(s, serverView(), NOW)
    advanceIncursion(s, NOW + 60 * 60 * 1000)
    expect(s.incursion?.orders).toHaveLength(1)
    dropGroup(s, 'abcdef12')
    advanceIncursion(s, NOW + 60 * 60 * 1000)
    expect(s.incursion?.orders.length).toBeGreaterThan(1)
  })

  it('sin servidor, la cola se juega en local con bots', () => {
    enterQueue(s, ID, uid, move, NOW)
    playQueueLocally(s, NOW)
    expect(s.incursionQueue).toBeNull()
    expect(s.incursion?.online).toBeNull()
    expect(keysOf(s, ID)).toBe(0)
  })
})

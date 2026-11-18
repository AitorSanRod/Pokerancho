import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POKEMON } from '../../../data/pokemon'
import { seqRng } from '../../core/test-utils'
import { initialState, MonPlace, monPlace, type GameState } from '../../core/state'
import { createMon } from '../../team/mons'
import { advanceIncursion, incursionBlocker } from '../incursionGame'
import { TEST_INCURSION } from '../incursion-test-mock'
import { keysOf } from '../keys'
import { repertoire } from '../repertoire'
import { checkinMember } from '../schedule/scheduleCheckin'
import { applyGroupView, dropGroup } from './linkedIncursion'
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
  s.incursionCheckin = { scheduleId: 'abcdef12', incursionId: ID, startAt: NOW, uid, moveId: move, locked: false }
})

/** Lo que diría el servidor de un grupo con este jugador dentro */
function serverView() {
  const member = checkinMember(s)!
  const g = formGroup('abcdef12', ID, [{ playerId: 'yo-mismo', nickname: 'Yo', member }], SERVER_NOW, seqRng(0.5))
  return groupView(g, 'yo-mismo', SERVER_NOW)!
}

describe('incursión con servidor', () => {
  it('con el checkin hecho el Pokémon queda apartado, pero la llave no se gasta', () => {
    expect(monPlace(s, uid)).toBe(MonPlace.Incursion)
    expect(keysOf(s, ID)).toBe(1)
    expect(checkinMember(s)).toMatchObject({ id: uid, moveId: move })
    expect(incursionBlocker(s, ID, uid, move)).not.toBeNull()
  })

  it('al empezar gasta la llave, entra y pasa las horas al reloj del móvil', () => {
    expect(applyGroupView(s, serverView(), NOW)).toBe(true)
    expect(keysOf(s, ID)).toBe(0)
    expect(s.incursionCheckin).toBeNull()
    expect(s.incursion?.legStarts).toEqual([NOW])
    expect(s.incursion?.online?.groupId).toBe('abcdef12')
  })

  it('entra con el Pokémon que tiene el servidor aunque en el móvil marcara otro después', () => {
    const view = serverView()
    const other = createMon(POKEMON.Snorlax, 20, 0)
    s.owned.push(other)
    s.incursionCheckin!.uid = other.uid
    expect(applyGroupView(s, view, NOW)).toBe(true)
    expect(s.incursion?.uid).toBe(uid)
  })

  it('no hace caso de un grupo que no es el suyo', () => {
    const view = serverView()
    s.incursionCheckin = null
    expect(applyGroupView(s, view, NOW)).toBe(false)
    expect(s.incursion).toBeNull()
  })

  it('con grupo, los tramos los decide el servidor; si lo olvida, sigue en local', () => {
    applyGroupView(s, serverView(), NOW)
    advanceIncursion(s, NOW + 60 * 60 * 1000)
    expect(s.incursion?.orders).toHaveLength(1)
    dropGroup(s, 'abcdef12')
    advanceIncursion(s, NOW + 60 * 60 * 1000)
    expect(s.incursion?.orders.length).toBeGreaterThan(1)
  })
})

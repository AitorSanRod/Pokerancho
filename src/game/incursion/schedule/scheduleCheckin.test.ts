import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POKEMON } from '../../../data/pokemon'
import { initialState, type GameState } from '../../core/state'
import { createMon } from '../../team/mons'
import { TEST_INCURSION } from '../incursion-test-mock'
import { repertoire } from '../repertoire'
import { checkinMonBlocker, lockCheckinMon, markCheckinMon } from './scheduleCheckin'
import { NOW } from './schedule-test-utils'

vi.mock('../../../data/incursions', () => import('../incursion-test-mock'))

const ID = TEST_INCURSION.id
const LEVEL = TEST_INCURSION.minLevel
const MOVE = repertoire(POKEMON.Snorlax, LEVEL)[0].id
let s: GameState
let first: string
let second: string

beforeEach(() => {
  s = initialState()
  const a = createMon(POKEMON.Snorlax, LEVEL, 0)
  const b = createMon(POKEMON.Snorlax, LEVEL, 0)
  s.owned.push(a, b)
  first = a.uid
  second = b.uid
  s.incursionKeys[ID] = 1
  s.incursionCheckin = { scheduleId: 'abcdef12', incursionId: ID, startAt: NOW, uid: first, moveId: MOVE, locked: false }
})

describe('Pokémon marcado en la sala', () => {
  it('el ya marcado se puede volver a marcar aunque esté reservado', () => {
    expect(checkinMonBlocker(s, ID, first, MOVE)).toBeNull()
  })

  it('no se puede marcar uno que no está en el rancho', () => {
    s.owned.find((m) => m.uid === second)!.ranch = null
    expect(checkinMonBlocker(s, ID, second, MOVE)).not.toBeNull()
  })

  it('sin llave no se puede marcar ninguno', () => {
    s.incursionKeys = {}
    expect(checkinMonBlocker(s, ID, second, MOVE)).not.toBeNull()
  })

  it('se cambia de Pokémon y de ataque mientras no esté fijado', () => {
    markCheckinMon(s, second, MOVE)
    expect(s.incursionCheckin).toMatchObject({ uid: second, moveId: MOVE })
  })

  it('un Pokémon que no puede entrar no se marca', () => {
    markCheckinMon(s, second, 'no-existe')
    expect(s.incursionCheckin?.uid).toBe(first)
  })

  it('fijado, ya no cambia', () => {
    lockCheckinMon(s)
    markCheckinMon(s, second, MOVE)
    expect(s.incursionCheckin).toMatchObject({ uid: first, locked: true })
  })

  it('sin Pokémon marcado, fijar no hace nada', () => {
    s.incursionCheckin = { ...s.incursionCheckin!, uid: null, moveId: null }
    lockCheckinMon(s)
    expect(s.incursionCheckin?.locked).toBe(false)
  })
})

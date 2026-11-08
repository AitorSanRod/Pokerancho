import { beforeEach, describe, expect, it, vi } from 'vitest'
import { IncursionId } from '../../data/incursions'
import { POKEMON } from '../../data/pokemon'
import { boostedMoney } from '../battle/rewards'
import { seqRng } from '../core/test-utils'
import { initialState, MonPlace, monPlace, type GameState } from '../core/state'
import { createMon } from '../team/mons'
import { incursionProgress, IncursionPhase, recordOf, REGROUP_MS } from './activeIncursion'
import { advanceIncursion, chooseIncursionMove, collectIncursion, continueIncursion, incursionBlocker, retreatIncursion, startIncursion } from './incursionGame'
import { legDuration } from './incursionTimeline'
import { PARTY_SIZE } from './party'
import { repertoire } from './repertoire'

vi.mock('../../data/incursions', () => import('./incursion-test-mock'))

const ID = IncursionId.Prueba
const LEVEL = 20
const NOW = 1_000_000
let s: GameState
let uid: string
let move: string

beforeEach(() => {
  s = initialState()
  const mon = createMon(POKEMON.Snorlax, LEVEL, 0)
  s.owned.push(mon)
  s.activeUid = mon.uid
  uid = mon.uid
  move = repertoire(mon.speciesId, LEVEL)[0].id
  s.incursionKeys[ID] = 1
})

const start = () => startIncursion(s, ID, uid, move, NOW, seqRng(0.5))
const endOfLeg = (leg: number) => s.incursion!.legStarts[leg] + legDuration(recordOf(s.incursion!).legs[leg])

describe('entrar en una incursión', () => {
  it('hace falta una llave, el nivel justo y un movimiento que conozca', () => {
    expect(incursionBlocker(s, ID, uid, move)).toBeNull()
    expect(incursionBlocker(s, ID, uid, 'no-existe')).not.toBeNull()
    s.owned[0].level = 5
    expect(incursionBlocker(s, ID, uid, move)).not.toBeNull()
    s.owned[0].level = 90
    expect(incursionBlocker(s, ID, uid, move)).not.toBeNull()
    s.owned[0].level = LEVEL
    s.incursionKeys[ID] = 0
    expect(incursionBlocker(s, ID, uid, move)).not.toBeNull()
  })

  it('gasta la llave, completa el grupo con bots y el Pokémon sale del rancho', () => {
    start()
    expect(s.incursionKeys[ID]).toBe(0)
    expect(s.incursion!.members).toHaveLength(PARTY_SIZE)
    expect(monPlace(s, uid)).toBe(MonPlace.Incursion)
    expect(incursionBlocker(s, ID, uid, move)).not.toBeNull()
  })
})

describe('incursión en curso', () => {
  it('tras el primer tramo llega la sala de reorganizar y, al acabar su plazo, sigue sola', () => {
    start()
    expect(incursionProgress(s.incursion!, NOW).phase).toBe(IncursionPhase.Playing)
    const end = endOfLeg(0)
    expect(incursionProgress(s.incursion!, end).phase).toBe(IncursionPhase.Regroup)
    advanceIncursion(s, end + REGROUP_MS)
    expect(s.incursion!.legStarts).toEqual([NOW, end + REGROUP_MS])
  })

  it('al reorganizar puede cambiar de movimiento y seguir sin esperar', () => {
    start()
    const other = repertoire(POKEMON.Snorlax, LEVEL)[1].id
    const end = endOfLeg(0)
    chooseIncursionMove(s, other, end)
    continueIncursion(s, end + 1)
    expect(s.incursion!.orders[1].moves[uid]).toBe(other)
    expect(s.incursion!.legStarts[1]).toBe(end + 1)
  })

  it('al terminarla cobra lo ganado y el Pokémon vuelve al rancho', () => {
    start()
    continueIncursion(s, endOfLeg(0))
    const finish = endOfLeg(1)
    const { earned } = recordOf(s.incursion!)
    const money = s.money
    expect(collectIncursion(s, finish - 1)).toBeNull()
    expect(collectIncursion(s, finish)).toEqual(earned)
    expect(s.money).toBe(money + boostedMoney(earned.money))
    expect(s.incursion).toBeNull()
    expect(monPlace(s, uid)).toBe(MonPlace.Ranch)
  })

  it('al retirarse se termina en ese momento, con lo ganado hasta entonces', () => {
    start()
    retreatIncursion(s, NOW)
    expect(incursionProgress(s.incursion!, NOW).phase).toBe(IncursionPhase.Finished)
    const money = s.money
    collectIncursion(s, NOW)
    expect(s.money).toBe(money)
  })
})

import { describe, expect, it, vi } from 'vitest'
import { player, rng, snap, tabRoom } from './online-test-utils'
import { creditCrits } from './sharedCrits'
import { isOver, seatPlayer } from './sharedRoom'

vi.mock('../../../data/maps/kantoMaps', () => import('../../core/test-map'))

function seated() {
  const room = tabRoom()
  seatPlayer(room, player(1), 'Ana', snap('a'))
  return room
}

describe('críticos en el servidor', () => {
  it('acepta como mucho uno por ronda jugada y quita vida al jefe', () => {
    const room = seated()
    const hp = room.raid.hp
    room.raid.round += 2
    expect(creditCrits(room, player(1), 'a', 5, rng)).toBe(2)
    expect(room.raid.hp).toBeLessThan(hp)
    expect(creditCrits(room, player(1), 'a', 1, rng)).toBe(0)
  })

  it('un crítico puede tumbar al jefe y deja la sala acabada', () => {
    const room = seated()
    room.raid.hp = 1
    room.raid.round += 2
    expect(creditCrits(room, player(1), 'a', 2, rng)).toBe(1)
    expect(room.raid.hp).toBe(0)
    expect(isOver(room)).toBe(true)
  })

  it('no cuenta los de quien no está sentado', () => {
    const room = seated()
    room.raid.round += 1
    expect(creditCrits(room, player(2), 'a', 1, rng)).toBe(0)
  })
})

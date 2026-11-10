import { describe, expect, it, vi } from 'vitest'
import { POKEMON } from '../../data/pokemon'
import { seqRng } from '../core/test-utils'
import { recordOf } from './activeIncursion'
import { TEST_INCURSION } from './incursion-test-mock'
import { formGroup } from './online/sharedIncursion'
import { freshMember } from './party'
import { repertoire } from './repertoire'
import { settleTaps } from './tapSettle'
import { noTurnOrders } from './tapWindow'

vi.mock('../../data/incursions', () => import('./incursion-test-mock'))

const NOW = 1_000_000
const FAR = NOW + 24 * 60 * 60 * 1000
const member = (id: string) => freshMember({ id, speciesId: POKEMON.Snorlax, level: 20, stars: 0, moveId: repertoire(POKEMON.Snorlax, 20)[0].id })
const boosting = { boosted: ['mon0'], picks: {} }
const plan = () => formGroup('abcdef12', TEST_INCURSION.id, [{ playerId: 'jugador-0', nickname: 'J', member: member('mon0'), joinedAt: NOW }], NOW, seqRng(0.5))

describe('cerrar ventanas de toques', () => {
  it('antes de su hora no cierra nada', () => {
    const g = plan()
    expect(settleTaps(g, NOW, 0, boosting)).toBe(false)
    expect(g.orders[0].turns).toEqual([])
  })

  it('cierra de una vez todas las pasadas: la primera con los que llegaron a tiempo y las demás sin nadie', () => {
    const g = plan()
    expect(settleTaps(g, FAR, 0, boosting)).toBe(true)
    const [first, ...rest] = g.orders[0].turns
    expect(first).toEqual(boosting)
    for (const turn of rest) expect(turn).toEqual(noTurnOrders())
    expect(recordOf(g).legs[0].turns).toEqual(g.orders[0].turns)
  })

  it('las ya cerradas no se tocan', () => {
    const g = plan()
    settleTaps(g, FAR, 0, boosting)
    const closed = structuredClone(g.orders[0].turns)
    expect(settleTaps(g, FAR, 0, noTurnOrders())).toBe(false)
    expect(g.orders[0].turns).toEqual(closed)
  })
})

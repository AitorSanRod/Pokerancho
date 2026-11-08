import { describe, expect, it } from 'vitest'
import { INCURSIONS, MAX_KEYS } from '../../data/incursions'
import { initialState } from '../core/state'
import { keysOf } from '../incursion/keys'
import { claimServerGift, parseServerGifts, pendingServerGifts } from './serverGifts'

const ID = INCURSIONS[0].id
const gift = { id: 'regalo-1', title: 'Un regalo', incursionKeys: { [ID]: 1 } }

describe('regalos del servidor', () => {
  it('se descarta lo que no tiene buena forma y las incursiones que no existen', () => {
    const parsed = parseServerGifts([gift, { id: 'MAL ID', title: 'x', incursionKeys: {} }, { ...gift, id: 'otro', incursionKeys: { quitada: 2, [ID]: -1 } }, 'basura'])
    expect(parsed).toEqual([gift, { id: 'otro', title: gift.title, incursionKeys: {} }])
    expect(parseServerGifts(null)).toEqual([])
  })

  it('se recoge una sola vez y deja de estar pendiente', () => {
    const s = initialState()
    expect(pendingServerGifts(s, [gift])).toHaveLength(1)
    expect(claimServerGift(s, gift)).toBe(true)
    expect(keysOf(s, ID)).toBe(1)
    expect(claimServerGift(s, gift)).toBe(false)
    expect(keysOf(s, ID)).toBe(1)
    expect(pendingServerGifts(s, [gift])).toEqual([])
  })

  it('las llaves no pasan del máximo', () => {
    const s = initialState()
    s.incursionKeys[ID] = MAX_KEYS
    claimServerGift(s, gift)
    expect(keysOf(s, ID)).toBe(MAX_KEYS)
  })
})

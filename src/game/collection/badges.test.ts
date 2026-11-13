import { describe, expect, it } from 'vitest'
import { BADGE_IDS } from '../../data/badges'
import { initialState } from '../core/state'
import { earnBadge, hasBadge } from './badges'

describe('medallas', () => {
  it('se ganan una sola vez', () => {
    const s = initialState()
    const [badge] = BADGE_IDS
    expect(hasBadge(s, badge)).toBe(false)
    expect(earnBadge(s, badge)).toBe(true)
    expect(earnBadge(s, badge)).toBe(false)
    expect(s.badges).toEqual([badge])
  })
})

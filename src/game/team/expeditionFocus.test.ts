import { describe, expect, it } from 'vitest'
import { EXPEDITION_FOCUSES, focusMult, isExpeditionFocus } from './expeditionFocus'

describe('enfoque de expedición', () => {
  it('lo elegido sale mejor que lo demás', () => {
    for (const focus of EXPEDITION_FOCUSES) {
      for (const other of EXPEDITION_FOCUSES.filter((f) => f !== focus)) expect(focusMult(focus, focus)).toBeGreaterThan(focusMult(focus, other))
    }
  })

  it('solo reconoce los enfoques que existen', () => {
    expect(EXPEDITION_FOCUSES.every(isExpeditionFocus)).toBe(true)
    expect(isExpeditionFocus('nada')).toBe(false)
  })
})

import { describe, expect, it } from 'vitest'
import { addStages, MAX_STAGES, noStages, stageMult } from './statStages'

describe('etapas de stats', () => {
  it('como en los juegos: al máximo, ×4; al mínimo, ×1/4; sin etapas, igual', () => {
    expect(stageMult(0)).toBe(1)
    expect(stageMult(MAX_STAGES)).toBe(4)
    expect(stageMult(-MAX_STAGES)).toBe(0.25)
    expect(stageMult(1)).toBe(1.5)
    expect(stageMult(-1)).toBeCloseTo(2 / 3)
  })

  it('se suman hasta el tope; al tope no hacen nada', () => {
    const s = noStages()
    expect(addStages(s, 'atk', 2)).toBe(2)
    expect(addStages(s, 'atk', MAX_STAGES)).toBe(MAX_STAGES - 2)
    expect(addStages(s, 'atk', 1)).toBe(0)
    expect(s.atk).toBe(MAX_STAGES)
    expect(addStages(s, 'def', -MAX_STAGES - 3)).toBe(-MAX_STAGES)
    expect(addStages(s, 'def', -1)).toBe(0)
  })
})

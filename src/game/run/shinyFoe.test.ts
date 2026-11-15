import { describe, expect, it } from 'vitest'
import { foeExpMult, foeStatMult, rollShinyFoe, SHINY_FOE_CHANCE, SHINY_FOE_EXP_MULT, SHINY_FOE_STAT_BONUS } from './shinyFoe'

describe('rivales shiny', () => {
  it('sale shiny solo por debajo de su probabilidad', () => {
    expect(rollShinyFoe(() => SHINY_FOE_CHANCE / 2)).toBe(true)
    expect(rollShinyFoe(() => SHINY_FOE_CHANCE)).toBe(false)
  })

  it('el shiny suma su bono a las stats de la parada y multiplica la EXP', () => {
    expect(foeStatMult(1.2, false)).toBe(1.2)
    expect(foeStatMult(1.2, true)).toBe(1.2 + SHINY_FOE_STAT_BONUS)
    expect([foeExpMult(false), foeExpMult(true)]).toEqual([1, SHINY_FOE_EXP_MULT])
  })
})

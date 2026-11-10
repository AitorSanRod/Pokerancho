import { describe, expect, it } from 'vitest'
import { ally } from './incursion-test-utils'
import { healAmount, referenceDefense } from './healing'

describe('cura de incursión', () => {
  it('la Defensa de referencia crece con el nivel', () => {
    expect(referenceDefense(50)).toBeGreaterThan(referenceDefense(10))
  })

  it('cura más con más potencia y más Ataque', () => {
    const healer = ally('h')
    expect(healAmount(healer, 80)).toBeGreaterThan(healAmount(healer, 40))
    const strong = ally('s')
    strong.base.atk *= 2
    expect(healAmount(strong, 40)).toBeGreaterThan(healAmount(healer, 40))
  })

  it('sin potencia apenas cura', () => {
    expect(healAmount(ally('h'), 0)).toBeLessThan(healAmount(ally('h'), 1))
  })
})

import { describe, expect, it } from 'vitest'
import { CRIT_EARLY_MS, CRIT_LATE_MS, CRIT_RING_MS, judgeRing, ringKey, ringShown } from './critTiming'

const AT = 10_000
const GUARD = AT + CRIT_LATE_MS + 500

describe('toque crítico', () => {
  it('la clave de un golpe es siempre la misma y decide siempre igual si sale anillo', () => {
    expect(ringKey('ruta', 3, 'a')).toBe(ringKey('ruta', 3, 'a'))
    expect(ringKey('ruta', 3, 'a')).not.toBe(ringKey('ruta', 4, 'a'))
    const key = ringKey('x', 1)
    expect(ringShown(key)).toBe(ringShown(key))
  })

  it('un solo toque a tiempo es crítico; sin tocar no pasa nada', () => {
    expect(judgeRing(AT, GUARD, [AT - CRIT_EARLY_MS])).toBe('crit')
    expect(judgeRing(AT, GUARD, [AT + CRIT_LATE_MS])).toBe('crit')
    expect(judgeRing(AT, GUARD, [])).toBeNull()
  })

  it('tocar pronto, tarde o varias veces falla; los toques fuera del anillo no cuentan', () => {
    expect(judgeRing(AT, GUARD, [AT - CRIT_EARLY_MS - 1])).toBe('fail')
    expect(judgeRing(AT, GUARD, [AT + CRIT_LATE_MS + 1])).toBe('fail')
    expect(judgeRing(AT, GUARD, [AT, AT + 10])).toBe('fail')
    expect(judgeRing(AT, GUARD, [AT - CRIT_RING_MS - 1, AT])).toBe('crit')
    expect(judgeRing(AT, GUARD, [AT, GUARD + 1])).toBe('crit')
  })
})

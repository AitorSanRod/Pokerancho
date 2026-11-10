import { describe, expect, it } from 'vitest'
import { Nature, NATURES, NEUTRAL_NATURE } from '../../data/natures'
import { POKEMON } from '../../data/pokemon'
import { seqRng } from '../core/test-utils'
import { isNature, NATURE_MOD, natureMult, randomNature } from './natures'
import { calcStats } from './stats'

const LEVEL = 50
const [boosting] = Object.values(Nature).filter((n) => NATURES[n].up !== null)

describe('naturalezas', () => {
  it('cada una sube una stat y baja otra distinta; la neutra no toca ninguna', () => {
    for (const n of Object.values(Nature)) {
      const { up, down } = NATURES[n]
      expect(up === null).toBe(down === null)
      if (up) expect(up).not.toBe(down)
    }
    expect(NATURES[NEUTRAL_NATURE]).toMatchObject({ up: null, down: null })
  })

  it('el multiplicador sube, baja o deja igual cada stat', () => {
    const { up, down } = NATURES[boosting]
    expect(natureMult(boosting, up!)).toBe(1 + NATURE_MOD)
    expect(natureMult(boosting, down!)).toBe(1 - NATURE_MOD)
    expect(natureMult(NEUTRAL_NATURE, up!)).toBe(1)
    expect(natureMult(undefined, up!)).toBe(1)
  })

  it('las stats cambian según la naturaleza y los PS no', () => {
    const { up, down } = NATURES[boosting]
    const neutral = calcStats(POKEMON.Bulbasaur, LEVEL)
    const natured = calcStats(POKEMON.Bulbasaur, LEVEL, 0, boosting)
    expect(natured[up!]).toBeGreaterThan(neutral[up!])
    expect(natured[down!]).toBeLessThan(neutral[down!])
    expect(natured.hp).toBe(neutral.hp)
    expect(calcStats(POKEMON.Bulbasaur, LEVEL, 0, NEUTRAL_NATURE)).toEqual(neutral)
  })

  it('al azar sale cualquiera de la lista', () => {
    const all = Object.values(Nature)
    expect(randomNature(seqRng(0))).toBe(all[0])
    expect(randomNature(seqRng(0.999))).toBe(all.at(-1))
    expect(isNature(randomNature())).toBe(true)
    expect(isNature('inventada')).toBe(false)
  })
})

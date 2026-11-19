import { describe, expect, it } from 'vitest'
import { pickWeighted } from './random'
import { seqRng } from './test-utils'

describe('pickWeighted', () => {
  const entries: [string, number][] = [['a', 3], ['b', 1]]

  it('reparte según el peso de cada valor', () => {
    expect(pickWeighted(entries, seqRng(0))).toBe('a')
    expect(pickWeighted(entries, seqRng(0.74))).toBe('a')
    expect(pickWeighted(entries, seqRng(0.75))).toBe('b')
    expect(pickWeighted(entries, seqRng(0.999))).toBe('b')
  })

  it('un valor sin peso no sale nunca', () => {
    expect(pickWeighted([['a', 0], ['b', 1]], seqRng(0))).toBe('b')
  })
})

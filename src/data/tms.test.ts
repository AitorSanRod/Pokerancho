import { describe, expect, it } from 'vitest'
import { incursionMove } from './incursionMoves'
import { isTm, TM_IDS, TMS } from './tms'

describe('MTs', () => {
  it('cada una se guarda con el id del ataque que enseña, que existe, y la aprende algún tipo', () => {
    for (const tm of TM_IDS) {
      expect(TMS[tm].move.id).toBe(tm)
      expect(incursionMove(tm)).toBe(TMS[tm].move)
      expect(TMS[tm].types.length).toBeGreaterThan(0)
    }
    expect(isTm('no-existe')).toBe(false)
  })
})

import { describe, expect, it } from 'vitest'
import { INCURSIONS, IncursionPrizeKind, MAX_ROOM_FOES, RoomKind } from '.'
import { TM_IDS } from '../tms'

describe('salas de las incursiones', () => {
  it(`ninguna sala de combate tiene más de ${MAX_ROOM_FOES} rivales ni se queda vacía`, () => {
    for (const inc of INCURSIONS) {
      for (const room of inc.rooms) {
        if (room.kind !== RoomKind.Battle) continue
        const where = `${inc.name} › ${room.name}`
        expect(room.foes.length, where).toBeGreaterThan(0)
        expect(room.foes.length, where).toBeLessThanOrEqual(MAX_ROOM_FOES)
      }
    }
  })
})

describe('premios de las incursiones', () => {
  it('cada MT sale en alguna incursión', () => {
    const dropped = new Set(INCURSIONS.flatMap((inc) => inc.prizes.flatMap((p) => (p.kind === IncursionPrizeKind.Tm ? [p.tm] : []))))
    for (const tm of TM_IDS) expect(dropped.has(tm), tm).toBe(true)
  })

  it('las probabilidades van de 0 a 1', () => {
    for (const inc of INCURSIONS) {
      for (const p of inc.prizes) expect(p.chance > 0 && p.chance <= 1, inc.name).toBe(true)
    }
  })
})

import { describe, expect, it } from 'vitest'
import { INCURSIONS, MAX_ROOM_FOES, RoomKind } from '.'

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

import { describe, expect, it } from 'vitest'
import { seqRng } from '../../core/test-utils'
import { repertoire } from '../../incursion/repertoire'
import { joinRaid, RaidLink } from '../raid'
import { raidReady, ROTATION } from '../raid-test-utils'
import { fightStart, lobbyStart } from '../raidSchedule'
import { applyRoomView, dropRoom, joinRequest } from './linkedRaid'
import { RaidAction } from './protocol'
import { advanceShared, createShared, joinShared, roomView } from './sharedRaid'

const CYCLE = 20
const OPEN = lobbyStart(CYCLE) + 1000
const SERVER_AHEAD = 5000

/** Partida que ha pedido entrar y la sala del servidor en la que se sienta */
function joining() {
  const ready = raidReady(CYCLE)
  joinRaid(ready.s, ROTATION, ready.mon.uid, ready.move, OPEN)
  const server = createShared('tab/ordered/20/x', ROTATION, CYCLE, OPEN, seqRng(0.2))
  joinShared(server, 'yo', 'Yo', joinRequest(ready.s, ROTATION)!.member, OPEN)
  return { ...ready, server }
}

describe('sala enlazada con el servidor', () => {
  it('pide entrar con su Pokémon y su ataque', () => {
    const { s, mon, move } = joining()
    expect(joinRequest(s, ROTATION)).toMatchObject({ action: RaidAction.Join, rotation: ROTATION, member: { id: mon.uid, moveId: move } })
  })

  it('con la respuesta, la sala es la del servidor y sus horas pasan al reloj del móvil', () => {
    const { s, server } = joining()
    advanceShared(server, fightStart(CYCLE))
    const view = roomView(server, 'yo', fightStart(CYCLE) + SERVER_AHEAD)!
    applyRoomView(s, ROTATION, view, fightStart(CYCLE))
    const tr = s.raids[ROTATION]!
    expect(tr.link).toBe(RaidLink.Online)
    expect(tr.room.id).toBe(server.id)
    expect(tr.room.fight!.legStarts[0]).toBe(server.fight!.legStarts[0] - SERVER_AHEAD)
    expect(joinRequest(s, ROTATION)).toBeNull()
  })

  it('si mientras tanto cambió de ataque, se le deja el suyo y se sigue pidiendo', () => {
    const { s, mon, server } = joining()
    const other = repertoire(mon.speciesId, mon.level).at(-1)!.id
    joinRaid(s, ROTATION, mon.uid, other, OPEN)
    applyRoomView(s, ROTATION, roomView(server, 'yo', OPEN)!, OPEN)
    expect(s.raids[ROTATION]!.link).toBe(RaidLink.Joining)
    expect(joinRequest(s, ROTATION)!.member.moveId).toBe(other)
  })

  it('si el servidor la pierde, sigue en local', () => {
    const { s } = joining()
    dropRoom(s, ROTATION)
    expect(s.raids[ROTATION]!.link).toBe(RaidLink.Local)
  })
})

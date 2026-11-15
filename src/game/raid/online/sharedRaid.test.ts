import { describe, expect, it } from 'vitest'
import { seqRng } from '../../core/test-utils'
import { IncursionPhase } from '../../incursion/activeIncursion'
import { eventStartMs } from '../../incursion/incursionTimeline'
import { entrant } from '../raid-test-utils'
import { shownBots } from '../raidBots'
import { fightProgress } from '../raidFight'
import { RAID_ROOM_SIZE, roomBoss } from '../raidRoom'
import { cycleEnd, fightStart, lobbyStart } from '../raidSchedule'
import { takeDamageTally } from './damageTally'
import { RaidRotation } from './protocol'
import { advanceShared, createShared, critShared, joinShared, leaveShared, pickShared, roomFor, roomView, tapShared, type SharedRaid } from './sharedRaid'

const CYCLE = 12
const OPEN = lobbyStart(CYCLE) + 1000
const shared = (id = 'tab/ordered/12/a') => createShared(id, RaidRotation.Ordered, CYCLE, OPEN, seqRng(0.3))
const join = (room: SharedRaid, player: string, uid = player, now = OPEN) => joinShared(room, player, player, entrant(uid).member, now)

/** Hora a la que empieza la ventana de toques en la que está parada la pelea */
function openWindowAt(room: SharedRaid): number {
  const leg = fightProgress(room.fight!, roomBoss(room), fightStart(CYCLE)).record.legs[0]
  return room.fight!.legStarts[0] + eventStartMs(leg, leg.events.length - 1)
}

describe('sala del servidor', () => {
  it('cada jugador va a la suya o a la que tenga más jugadores con sitio', () => {
    const a = shared('tab/ordered/12/a')
    const b = shared('tab/ordered/12/b')
    join(b, 'p1')
    expect(roomFor([a, b], 'p2')).toBe(b)
    join(a, 'p3')
    expect(roomFor([a, b], 'p3')).toBe(a)
  })

  it('cada jugador lleva un Pokémon: al volver con otro, se cambia', () => {
    const room = shared()
    join(room, 'p1', 'mon1')
    join(room, 'p1', 'mon2')
    expect(room.entrants.map((e) => e.member.id)).toEqual(['mon2'])
    expect(room.seats).toEqual([{ playerId: 'p1', memberId: 'mon2' }])
  })

  it('no deja quitarle el sitio a otro jugador con su Pokémon', () => {
    const room = shared()
    join(room, 'p1', 'mon1')
    expect(join(room, 'p2', 'mon1')).toBe(false)
  })

  it('cada jugador echa a un bot; llena de jugadores ya no admite', () => {
    const room = shared()
    const late = fightStart(CYCLE) - 1
    for (let i = 0; i < RAID_ROOM_SIZE; i++) join(room, `p${i}`, `m${i}`, late)
    expect(shownBots(room, late)).toEqual([])
    expect(join(room, 'otro', 'otro', late)).toBe(false)
  })

  it('con la pelea empezada ya no se entra ni se sale', () => {
    const room = shared()
    join(room, 'p1')
    expect(join(room, 'p2', 'p2', fightStart(CYCLE))).toBe(false)
    advanceShared(room, fightStart(CYCLE))
    expect(leaveShared(room, 'p1')).toBe(false)
  })

  it('se puede salir con la sala abierta', () => {
    const room = shared()
    join(room, 'p1')
    expect(leaveShared(room, 'p1')).toBe(true)
    expect(room.entrants).toEqual([])
    expect(roomView(room, 'p1', OPEN)).toBeNull()
  })
})

describe('pelea en el servidor', () => {
  it('cierra cada ventana con los toques, los cambios de ataque y los críticos que llegaron a tiempo', () => {
    const room = shared()
    join(room, 'p1')
    advanceShared(room, fightStart(CYCLE))
    const at = openWindowAt(room)
    const moveId = room.entrants[0].member.moveId
    tapShared(room, 'p1', 0, at)
    pickShared(room, 'p1', { moveId, target: null }, at)
    critShared(room, 'p1', at)
    expect(roomView(room, 'p1', at)).toMatchObject({ you: 'p1', yourPick: { moveId, target: null }, yourCrit: true })
    advanceShared(room, at + 60_000)
    expect(room.fight!.orders[0].turns[0]).toEqual({ boosted: ['p1'], picks: { p1: { moveId, target: null } }, crits: ['p1'] })
    expect(room.tapPending).toEqual([])
  })

  it('lo que ve cada jugador no lleva los ids de los demás', () => {
    const room = shared()
    join(room, 'p1')
    join(room, 'p2')
    expect(JSON.stringify(roomView(room, 'p1', OPEN))).not.toContain('playerId')
  })

  it('el daño al jefe se apunta una sola vez, al terminar', () => {
    const room = shared()
    join(room, 'p1')
    advanceShared(room, fightStart(CYCLE))
    expect(takeDamageTally(room, fightStart(CYCLE))).toEqual([])
    const end = cycleEnd(CYCLE)
    advanceShared(room, end)
    expect(fightProgress(room.fight!, roomBoss(room), end).phase).toBe(IncursionPhase.Finished)
    const tally = takeDamageTally(room, end)
    expect(tally.map((t) => t.playerId)).toEqual(['p1'])
    expect(tally[0].damage).toBeGreaterThan(0)
    expect(takeDamageTally(room, end)).toEqual([])
  })
})

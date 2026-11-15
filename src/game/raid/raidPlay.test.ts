import { describe, expect, it } from 'vitest'
import { seqRng } from '../core/test-utils'
import { MonPlace, monPlace } from '../core/state'
import { IncursionPhase } from '../incursion/activeIncursion'
import { eventStartMs } from '../incursion/incursionTimeline'
import { joinRaid, leaveRaid, raidBlocker, RaidLink } from './raid'
import { advanceRaids, boostRaidTap, collectRaid, markRaidCrit, raidOrders, raidProgress, setRaidPick } from './raidPlay'
import { raidReady, ROTATION } from './raid-test-utils'
import { RAID_ROOM_SIZE } from './raidRoom'
import { cycleEnd, fightStart, lobbyStart } from './raidSchedule'
import { EventKind } from '../incursion/events'

const CYCLE = 10
const OPEN = lobbyStart(CYCLE) + 1000

/** Partida con su Pokémon ya en la sala local del ciclo */
function inRoom() {
  const ready = raidReady(CYCLE)
  joinRaid(ready.s, ROTATION, ready.mon.uid, ready.move, OPEN, seqRng(0.4))
  ready.s.raids[ROTATION]!.link = RaidLink.Local
  return ready
}

/** Hora a la que empieza la ventana de toques en la que está parada la pelea */
function openWindowAt(s: ReturnType<typeof inRoom>['s']): number {
  const tr = s.raids[ROTATION]!
  const leg = raidProgress(tr, fightStart(CYCLE))!.record.legs[0]
  return tr.room.fight!.legStarts[0] + eventStartMs(leg, leg.events.length - 1)
}

describe('entrar en la sala', () => {
  it('con la sala abierta, el Pokémon sale del rancho con su ataque', () => {
    const { s, mon } = inRoom()
    expect(monPlace(s, mon.uid)).toBe(MonPlace.Raid)
    expect(s.raids[ROTATION]!.room.entrants.map((e) => e.member.id)).toEqual([mon.uid])
  })

  it('con la pelea empezada ya no se entra', () => {
    const { s, mon, move } = raidReady(CYCLE)
    expect(raidBlocker(s, ROTATION, mon.uid, move, fightStart(CYCLE))).not.toBeNull()
  })

  it('al salir de la sala abierta vuelve al rancho', () => {
    const { s, mon } = inRoom()
    leaveRaid(s, ROTATION)
    expect(s.raids[ROTATION]).toBeNull()
    expect(monPlace(s, mon.uid)).toBe(MonPlace.Ranch)
  })
})

describe('la pelea sin servidor', () => {
  it('empieza a su hora con la sala llena de bots', () => {
    const { s } = inRoom()
    advanceRaids(s, fightStart(CYCLE))
    expect(s.raids[ROTATION]!.room.fight!.members).toHaveLength(RAID_ROOM_SIZE)
  })

  it('el ataque elegido, los toques y el crítico entran en la ventana de toques', () => {
    const { s, move } = inRoom()
    advanceRaids(s, fightStart(CYCLE))
    const at = openWindowAt(s)
    const tr = s.raids[ROTATION]!
    expect(raidProgress(tr, at)!.phase).toBe(IncursionPhase.Tap)
    expect(setRaidPick(s, ROTATION, { moveId: move, target: null }, at)).toBe(true)
    markRaidCrit(s, ROTATION, at)
    const orders = raidOrders(tr, true)
    boostRaidTap(s, ROTATION, at)
    expect(tr.room.fight!.orders[0].turns.at(-1)).toEqual(orders)
    expect(tr.pendingPick).toBeNull()
    expect(tr.pendingCrit).toBe(false)
  })

  it('al terminar se cobra y el Pokémon vuelve al rancho con los PS que le queden', () => {
    const { s, mon } = inRoom()
    const end = cycleEnd(CYCLE) - 1
    advanceRaids(s, end)
    expect(raidProgress(s.raids[ROTATION]!, end)!.phase).toBe(IncursionPhase.Finished)
    const money = s.money
    const prize = collectRaid(s, ROTATION, end)!
    expect(prize.uid).toBe(mon.uid)
    expect(s.money).toBe(money + prize.money)
    expect(s.raids[ROTATION]).toBeNull()
    expect(monPlace(s, mon.uid)).toBe(MonPlace.Ranch)
  })

  it('si no se recoge, al acabar el ciclo el premio va a Notificaciones', () => {
    const { s, mon } = inRoom()
    advanceRaids(s, cycleEnd(CYCLE))
    expect(s.raids[ROTATION]).toBeNull()
    expect(s.raidPrizes.map((p) => p.uid)).toEqual([mon.uid])
  })

  it('cada golpe del grupo al jefe sale en la pelea', () => {
    const { s } = inRoom()
    advanceRaids(s, cycleEnd(CYCLE) - 1)
    const events = raidProgress(s.raids[ROTATION]!, cycleEnd(CYCLE) - 1)!.record.legs[0].events
    expect(events.some((e) => e.kind === EventKind.Hit)).toBe(true)
  })
})

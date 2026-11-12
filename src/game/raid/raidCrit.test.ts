import { describe, expect, it, vi } from 'vitest'
import { TAP_CRIT_MULT } from '../battle/attack'
import { CRIT_EARLY_MS } from '../battle/critTiming'
import { RAID_ROUND_MS } from './raidCombat'
import { RAID_CRIT_GUARD_MS, playerHit, raidRing, raidRingAt, settleRaidCrit, tapRaid } from './raidCrit'
import { RAID_BOTS } from './raidBots'
import { addPlayer, advanceRoom, localHooks } from './raidEngine'
import { BOSS_ID } from './raidRoom'
import { raidState } from './raid-test-utils'

vi.mock('../../data/maps/kantoMaps', () => import('../core/test-map'))

const T = 5_000_000
const DEALT = 100
const bonus = Math.round(DEALT * (TAP_CRIT_MULT - 1))

/** El jugador en la sala, con un golpe al jefe al principio de la ronda que se ve; `ring`: una ronda con anillo o sin él */
function inRound(ring = true) {
  const { s, raid, mon } = raidState()
  addPlayer(s, raid, mon)
  raid.roundMsLeft = RAID_ROUND_MS
  raid.lastRound = [{ from: mon.uid, to: BOSS_ID, dealt: DEALT, eff: 1, fainted: false }]
  raid.hp = raid.maxHp
  for (raid.round = 1; (raidRing(raid) !== null) !== ring; raid.round++);
  s.lastTick = T
  return { s, raid, mon }
}

type Room = ReturnType<typeof inRound>
const settleAfterGuard = ({ s, raid }: Room) => settleRaidCrit(s, raid, T + RAID_CRIT_GUARD_MS)

describe('toque crítico contra el jefe', () => {
  it('no todas las rondas llevan anillo; en las que no, tocar no hace nada', () => {
    const room = inRound(false)
    expect(playerHit(room.raid)).not.toBeNull()
    expect(tapRaid(room.s, room.raid, T)).toBe(false)
  })

  it('el anillo se ve alrededor del golpe del jugador', () => {
    const { raid } = inRound()
    const hit = raidRing(raid)!
    expect(raidRingAt(raid, hit.at)).toEqual(hit)
    expect(raidRingAt(raid, hit.at + RAID_CRIT_GUARD_MS)).toBeNull()
  })

  it('un toque a tiempo quita el daño de más al jefe en una sala local', () => {
    const room = inRound()
    const { s, raid, mon } = room
    expect(tapRaid(s, raid, T)).toBe(true)
    settleRaidCrit(s, raid, T + 1)
    expect(raid.hp).toBe(raid.maxHp)
    settleAfterGuard(room)
    expect(raid.crit?.result).toBe('crit')
    expect(raid.hp).toBe(raid.maxHp - bonus)
    expect(raid.members.find((m) => m.id === mon.uid)!.damage).toBe(bonus)
    expect(raid.lastRound[0]).toMatchObject({ tapCrit: true, dealt: DEALT + bonus })
  })

  it('el crítico puede tumbar al jefe', () => {
    const room = inRound()
    room.raid.hp = 1
    tapRaid(room.s, room.raid, T)
    settleAfterGuard(room)
    expect(room.raid.hp).toBe(0)
  })

  it('dos toques, o uno a destiempo, fallan', () => {
    const twice = inRound()
    tapRaid(twice.s, twice.raid, T)
    tapRaid(twice.s, twice.raid, T + 1)
    settleAfterGuard(twice)
    expect(twice.raid.crit?.result).toBe('fail')
    expect(twice.raid.hp).toBe(twice.raid.maxHp)

    const late = inRound()
    late.raid.roundMsLeft = RAID_ROUND_MS + CRIT_EARLY_MS + 1
    tapRaid(late.s, late.raid, T)
    late.raid.roundMsLeft = RAID_ROUND_MS
    settleAfterGuard(late)
    expect(late.raid.crit?.result).toBe('fail')
  })

  it('en una sala del servidor queda pendiente de mandar y no toca la vida', () => {
    const room = inRound()
    room.raid.remote = { roomId: 'tab/x', exp: {}, openHp: null, target: null }
    tapRaid(room.s, room.raid, T)
    settleAfterGuard(room)
    expect(room.raid.remote.pendingCrits).toBe(1)
    expect(room.raid.hp).toBe(room.raid.maxHp)
  })

  it('sin golpe del jugador no hay nada que tocar', () => {
    const { s, raid } = inRound()
    raid.lastRound = []
    expect(tapRaid(s, raid, T)).toBe(false)
  })
})

describe('jefe tumbado entre rondas', () => {
  it('el motor no juega otra ronda: la pelea queda parada', () => {
    const { s, raid } = raidState()
    raid.hp = 0
    const round = raid.round
    expect(advanceRoom(raid, RAID_ROUND_MS * 3, RAID_BOTS, Math.random, localHooks(s))).toBe(RAID_ROUND_MS * 3)
    expect(raid.round).toBe(round)
  })
})

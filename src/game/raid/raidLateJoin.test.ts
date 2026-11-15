import { describe, expect, it } from 'vitest'
import { IncursionPhase } from '../incursion/activeIncursion'
import { settleGroupTaps } from '../incursion/tapSettle'
import { entrant, ROTATION } from './raid-test-utils'
import { bossHpAtJoin, bossShareTaken, finalBossHp, fightProgress, raidSource } from './raidFight'
import { lateJoinBlocker, lateLocalRoom, seatLate } from './raidLateJoin'
import { RAID_ROOM_SIZE, roomBoss } from './raidRoom'
import { cycleEnd, fightStart, RAID_FIGHT_MS } from './raidSchedule'

const CYCLE = 6
/** Un rato después de empezar la pelea, con el jefe aún lejos de la mitad */
const EARLY = fightStart(CYCLE) + RAID_FIGHT_MS / 10

const lateRoom = (now = EARLY) => lateLocalRoom('local/x', ROTATION, CYCLE, now)

/** La sala con un jugador que entró tarde, jugada entera sin toques */
function playedWithLateJoiner() {
  const room = lateRoom()
  const late = entrant('tarde')
  seatLate(room, late, EARLY)
  settleGroupTaps(room.fight!, raidSource(roomBoss(room)), cycleEnd(CYCLE) * 2, 0, { boosted: [], picks: {}, joins: [late.member] })
  return { room, p: fightProgress(room.fight!, roomBoss(room), cycleEnd(CYCLE)) }
}

describe('entrar en la pelea empezada', () => {
  it('se puede al poco de empezar, con bots en la sala', () => {
    const room = lateRoom()
    expect(room.fight).not.toBeNull()
    expect(lateJoinBlocker(room, EARLY)).toBeNull()
    expect(seatLate(room, entrant('a'), EARLY)).toBe(true)
    expect(seatLate(room, entrant('a'), EARLY)).toBe(false)
  })

  it('no se puede con la sala llena de jugadores ni con la pelea terminada', () => {
    const full = lateRoom()
    full.entrants = Array.from({ length: RAID_ROOM_SIZE }, (_, i) => entrant(`p${i}`))
    expect(lateJoinBlocker(full, EARLY)).not.toBeNull()
    const { room, p } = playedWithLateJoiner()
    expect(p.phase).toBe(IncursionPhase.Finished)
    expect(lateJoinBlocker(room, cycleEnd(CYCLE))).not.toBeNull()
  })

  it('el que entra tarde cobra por la vida del jefe que se le quita desde que entra', () => {
    const { room, p } = playedWithLateJoiner()
    const atJoin = bossHpAtJoin(room.fight!, p, 'tarde')!
    expect(atJoin).toBeLessThan(1)
    expect(bossShareTaken(room.fight!, p, 'tarde')).toBeCloseTo(atJoin - finalBossHp(p))
    expect(bossShareTaken(room.fight!, p, 'nadie')).toBe(0)
  })
})

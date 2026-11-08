import { describe, expect, it, vi } from 'vitest'
import { MonPlace, monPlace } from '../core/state'
import { advanceRaid, fallTabRaid, joinRaid, leaveRaid, LOCAL_ROTATION, monRaidBlocker, raidBlocker } from './raid'
import { raidState } from './raid-test-utils'
import { RAID_ROUND_MS } from './raidCombat'
import { playerMembers } from './raidEngine'
import { spentMember, TAB_RAID_LIVES } from './raidLives'
import { RAID_MIN_PRESENCE } from './raidPrizes'

vi.mock('../../data/maps/kantoMaps', () => import('../core/test-map'))

/** Partida con el Pokémon dentro de la sala local y el jefe con vida de sobra para no caer durante el test */
function inRaid() {
  const { s, raid, mon } = raidState()
  joinRaid(s, mon.uid)
  raid.hp = raid.maxHp = Number.MAX_SAFE_INTEGER
  const me = () => raid.members.find((m) => m.id === mon.uid)!
  return { s, raid, mon, me }
}

describe('vidas contra los jefes de la pestaña Raids', () => {
  it('el Pokémon entra con TAB_RAID_LIVES vidas', () => {
    const { me } = inRaid()
    expect(me().lives).toBe(TAB_RAID_LIVES)
  })

  it('al gastarlas sale de la sala con su premio y la pelea sigue sin él', () => {
    const { s, raid, mon, me } = inRaid()
    me().lives = 0
    advanceRaid(s, RAID_ROUND_MS)
    expect(playerMembers(raid)).toHaveLength(0)
    expect(monPlace(s, mon.uid)).toBe(MonPlace.Ranch)
    expect(s.raidPrizes).toMatchObject([{ uid: mon.uid, bossSpeciesId: raid.boss.speciesId }])
    expect(s.raids[LOCAL_ROTATION]).toBe(raid)
    expect(raid.hp).toBeGreaterThan(0)
  })

  it('sin el mínimo de presencia sale sin premio', () => {
    const { s, raid, me } = inRaid()
    raid.elapsedMs = 100 * RAID_ROUND_MS
    Object.assign(me(), { lives: 0, presentMs: 0 })
    advanceRaid(s, RAID_ROUND_MS)
    expect(me().presentMs).toBeLessThan(raid.elapsedMs * RAID_MIN_PRESENCE)
    expect(playerMembers(raid)).toHaveLength(0)
    expect(s.raidPrizes).toHaveLength(0)
  })

  it('no vuelve a cobrar cuando cae el jefe ni puede volver a entrar contra él', () => {
    const { s, raid, mon, me } = inRaid()
    me().lives = 0
    advanceRaid(s, RAID_ROUND_MS)
    expect(raidBlocker(s, mon.uid, LOCAL_ROTATION)).toMatch(/vidas/)
    fallTabRaid(s, LOCAL_ROTATION, raid, Math.random)
    expect(s.raidPrizes).toHaveLength(1)
  })

  it('tampoco puede ir a otra sala del mismo jefe, y la sala lo recuerda para el aviso', () => {
    const { s, raid, mon, me } = inRaid()
    me().lives = 0
    advanceRaid(s, RAID_ROUND_MS)
    const otherRoom = { ...structuredClone(raid), members: [] }
    expect(monRaidBlocker(s, mon.uid, LOCAL_ROTATION, otherRoom)).toMatch(/vidas/)
    expect(spentMember(s, raid)).toBe(me())
    expect(spentMember(s, otherRoom)).toBeUndefined()
  })

  it('retirarse y volver no repone las vidas', () => {
    const { s, mon, me } = inRaid()
    me().lives = 2
    leaveRaid(s, mon.uid)
    joinRaid(s, mon.uid)
    expect(me().lives).toBe(2)
  })
})

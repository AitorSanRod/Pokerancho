import { describe, expect, it, vi } from 'vitest'
import { STATUS_INFO, StatusId, TYPE_PASSIVES, type PassiveRef } from '../../data/passives'
import type { PokeType } from '../../data/types'
import { seqRng } from '../core/test-utils'
import { bossFighter, bossOwnMaxHp, playRound } from './raidCombat'
import { bossHas, bossStatuses, bossTurn, HELD_ROUNDS, statusTicks, takeInflicted } from './raidBossStatus'
import { BOSS_ID, newMember, RaidMemberKind, type Raid } from './raidRoom'
import { raidState, sparringSpecies } from './raid-test-utils'

vi.mock('../../data/maps/kantoMaps', () => import('../core/test-map'))

const noPassives = () => []

function soloRaid(): Raid {
  const { raid } = raidState()
  const speciesId = sparringSpecies(raid.boss.speciesId)
  raid.members = [newMember({ id: 'a', kind: RaidMemberKind.Bot, trainer: '', speciesId, level: raid.boss.level, stars: 0 })]
  return raid
}

const afflicted = (status: StatusId, by = 'a') => {
  const raid = soloRaid()
  const boss = bossFighter(raid)
  boss.status = status
  takeInflicted(raid, boss, by)
  return raid
}

/** Pasiva de nivel 1 de un tipo que pone un estado que dura hasta el final */
function inflictingPassive(): { ref: PassiveRef; chance: number; status: StatusId } {
  const [type, [effect]] = Object.entries(TYPE_PASSIVES).find(([, [e]]) => e.inflict && HELD_ROUNDS[e.inflict.status] === undefined)!
  return { ref: { type: type as PokeType, level: 1 }, chance: effect.inflict!.chance, status: effect.inflict!.status }
}

const bossAttacked = (hits: ReturnType<typeof playRound>) => hits.some((h) => h.from === BOSS_ID)

describe('estados del jefe comunitario', () => {
  it('el golpe que pone un estado se lo deja al jefe, con quien se lo puso', () => {
    const raid = afflicted(StatusId.Poison)
    expect(bossStatuses(raid)).toEqual([{ status: StatusId.Poison, by: 'a', rounds: null }])
  })

  it('lleva varios estados distintos a la vez, sin repetir ni cambiar a quien se lo puso', () => {
    const raid = afflicted(StatusId.Poison)
    const boss = bossFighter(raid)
    for (const [status, by] of [[StatusId.Burn, 'b'], [StatusId.Poison, 'b']] as const) {
      boss.status = status
      takeInflicted(raid, boss, by)
    }
    expect(bossStatuses(raid).map((b) => [b.status, b.by])).toEqual([[StatusId.Poison, 'a'], [StatusId.Burn, 'b']])
    expect(boss.status).toBeNull()
  })

  it('en la ronda, la pasiva pone el estado con su probabilidad y no se le quita con las rondas', () => {
    const { ref, chance, status } = inflictingPassive()
    const missed = soloRaid()
    playRound(missed, () => [ref], seqRng(chance))
    expect(bossHas(missed, status)).toBe(false)

    const raid = soloRaid()
    playRound(raid, () => [ref], seqRng(0))
    expect(bossHas(raid, status)).toBe(true)
    for (let i = 0; i < 10; i++) playRound(raid, noPassives, seqRng(0.5))
    expect(bossHas(raid, status)).toBe(true)
  })

  it('congelado, pierde el ataque de esa ronda y se descongela', () => {
    const raid = afflicted(StatusId.Freeze)
    expect(bossAttacked(playRound(raid, noPassives, seqRng(0.5)))).toBe(false)
    expect(bossHas(raid, StatusId.Freeze)).toBe(false)
    expect(bossAttacked(playRound(raid, noPassives, seqRng(0.5)))).toBe(true)
  })

  it('dormido, pierde los ataques de HELD_ROUNDS rondas y se despierta', () => {
    const raid = afflicted(StatusId.Sleep)
    for (let i = 0; i < HELD_ROUNDS[StatusId.Sleep]!; i++) expect(bossAttacked(playRound(raid, noPassives, seqRng(0.5)))).toBe(false)
    expect(bossHas(raid, StatusId.Sleep)).toBe(false)
    expect(bossAttacked(playRound(raid, noPassives, seqRng(0.5)))).toBe(true)
  })

  it('paralizado, a veces no ataca; confuso, a veces se golpea y cuenta para quien lo confundió', () => {
    const skip = STATUS_INFO[StatusId.Paralysis].skipChance!
    expect(bossTurn(afflicted(StatusId.Paralysis), seqRng(skip - 0.01)).kind).toBe('skip')
    expect(bossTurn(afflicted(StatusId.Paralysis), seqRng(skip)).kind).toBe('attack')
    expect(bossTurn(afflicted(StatusId.Confusion, 'b'), seqRng(0))).toEqual({ kind: 'self-hit', by: 'b' })
  })

  it('quemadura y veneno le quitan cada ronda una parte de sus PS de Pokémon, contada a quien se los puso', () => {
    const raid = afflicted(StatusId.Poison)
    const expected = Math.floor(bossOwnMaxHp(raid) * STATUS_INFO[StatusId.Poison].damagePerTurn!)
    expect(statusTicks(raid, bossOwnMaxHp(raid))).toEqual([{ status: StatusId.Poison, by: 'a', dealt: expected }])

    const hits = playRound(raid, () => [], seqRng(0.5))
    const tick = hits.find((h) => h.status === StatusId.Poison)!
    expect(tick).toMatchObject({ from: 'a', to: BOSS_ID, dealt: expected })
    const total = hits.filter((h) => h.to === BOSS_ID).reduce((sum, h) => sum + h.dealt, 0)
    expect(raid.members[0].damage).toBe(total)
    expect(raid.hp).toBe(raid.maxHp - total)
  })

  it('las salas empezadas antes de los estados del jefe siguen sin ellos hasta que cae', () => {
    const { ref, status } = inflictingPassive()
    const raid = soloRaid()
    delete raid.bossStatuses
    playRound(raid, () => [ref], seqRng(0))
    expect(bossHas(raid, status)).toBe(false)
    expect(bossStatuses(raid)).toEqual([])
    expect(bossTurn(raid, seqRng(0)).kind).toBe('attack')
  })
})

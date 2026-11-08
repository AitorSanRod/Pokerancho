import { describe, expect, it } from 'vitest'
import { battleMove } from '../../data/learnsets'
import { SPECIES } from '../../data/species'
import { MoveKind } from '../../data/supportMoves'
import { seqRng } from '../core/test-utils'
import { member, testIncursion } from './incursion-test-utils'
import { botMove, fillWithBots, isBot, PARTY_SIZE } from './party'
import { repertoire } from './repertoire'

const LEVEL = 50
const healer = SPECIES.find((sp) => repertoire(sp.id, LEVEL).some((mv) => mv.kind === MoveKind.Heal))!

describe('grupo de incursión', () => {
  it('completa el grupo con bots hasta cinco, del nivel de la incursión', () => {
    const inc = testIncursion([])
    const party = fillWithBots(inc, [member('p')], seqRng(0.5))
    expect(party).toHaveLength(PARTY_SIZE)
    expect(new Set(party.map((m) => m.id)).size).toBe(PARTY_SIZE)
    expect(party.slice(1).every((m) => isBot(m.id))).toBe(true)
    expect(isBot(party[0].id)).toBe(false)
    for (const bot of party.slice(1)) expect(bot.level).toBeGreaterThanOrEqual(inc.minLevel)
  })

  it('los bots no pasan del nivel máximo de la incursión', () => {
    const inc = { ...testIncursion([]), minLevel: 10, maxLevel: 10 }
    for (const bot of fillWithBots(inc, [], seqRng(0.99))) expect(bot.level).toBe(inc.maxLevel)
  })

  it('un bot cura si nadie cura; si ya hay quien cure, hace otra cosa', () => {
    expect(battleMove(botMove(healer.id, LEVEL, [])).kind).toBe(MoveKind.Heal)
    const heal = repertoire(healer.id, LEVEL).find((mv) => mv.kind === MoveKind.Heal)!
    expect(battleMove(botMove(healer.id, LEVEL, [heal])).kind).not.toBe(MoveKind.Heal)
  })

  it('sin papel que cubrir, usa su golpe más fuerte', () => {
    const heal = repertoire(healer.id, LEVEL).find((mv) => mv.kind === MoveKind.Heal)!
    const taunt = { ...heal, kind: MoveKind.Taunt, turns: 1, guard: 0 } as const
    const chosen = battleMove(botMove(healer.id, LEVEL, [heal, taunt]))
    const strongest = Math.max(...repertoire(healer.id, LEVEL).map((mv) => (mv.kind === MoveKind.Damage ? mv.power : 0)))
    expect(chosen.kind === MoveKind.Damage && chosen.power).toBe(strongest)
  })
})

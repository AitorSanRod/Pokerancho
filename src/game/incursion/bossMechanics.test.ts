import { describe, expect, it } from 'vitest'
import { HIT, ally, enemy, field, moveWith } from './incursion-test-utils'
import { EffectKind } from '../../data/incursionMoves'
import { bossTurnStart, isAreaTurn } from './bossMechanics'
import { stat } from './fighter'

const FROM = 3
const EVERY = 2
const RAGE = 1

describe('mecánicas de jefe', () => {
  it('la furia sube su Ataque desde su turno y cada tantos turnos', () => {
    const boss = enemy('j', { boss: { enrage: { fromTurn: FROM, every: EVERY, atk: RAGE } } })
    const { bf } = field([ally('a')], [boss])
    const base = stat(boss, 'atk')
    for (bf.turn = 1; bf.turn <= FROM + EVERY; bf.turn++) bossTurnStart(bf, boss)
    expect(boss.stages.atk).toBe(2 * RAGE)
    expect(stat(boss, 'atk')).toBeGreaterThan(base)
  })

  it('por debajo de su vida de fase cambia de movimiento', () => {
    const other = moveWith(EffectKind.Taunt).id
    const boss = enemy('j', { moveIds: [HIT], boss: { phase: { belowHp: 0.5, moveIds: [other] } } })
    const { bf } = field([ally('a')], [boss])
    bossTurnStart(bf, boss)
    expect(boss.move.id).toBe(HIT)
    boss.hp = Math.floor(boss.maxHp / 3)
    bossTurnStart(bf, boss)
    expect(boss.move.id).toBe(other)
  })

  it('golpea en área cada tantos turnos', () => {
    const boss = enemy('j', { boss: { areaEvery: EVERY } })
    const { bf } = field([ally('a')], [boss])
    bf.turn = EVERY
    expect(isAreaTurn(bf, boss)).toBe(true)
    bf.turn = EVERY + 1
    expect(isAreaTurn(bf, boss)).toBe(false)
  })
})

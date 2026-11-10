import { describe, expect, it } from 'vitest'
import { battleMove } from '../../data/learnsets'
import { MoveKind } from '../../data/supportMoves'
import { ally, enemy, field, HIT, supportOf } from './incursion-test-utils'
import { applyPicks, pickedTarget, PickSide, pickSide } from './movePicks'
import { performMove } from './moveEffects'
import { seqRng } from '../core/test-utils'
import { EventKind } from './events'

describe('elegir ataque y objetivo', () => {
  it('cambia el ataque y el objetivo del Pokémon del grupo; un ataque que no existe se ignora', () => {
    const a = ally('a')
    const heal = supportOf(MoveKind.Heal)
    const { bf } = field([a], [enemy('e')])
    applyPicks(bf, { a: { moveId: heal.id, target: 'a' }, nadie: { moveId: HIT, target: null } })
    expect(a.move.id).toBe(heal.id)
    expect(a.target).toBe('a')
    applyPicks(bf, { a: { moveId: 'no-existe', target: null } })
    expect(a.move.id).toBe(heal.id)
  })

  it('el golpe va al rival elegido mientras siga en pie; si cae, vuelve a elegir solo', () => {
    const a = ally('a')
    const [first, second] = [enemy('e1', { hpMult: 50 }), enemy('e2', { hpMult: 50 })]
    const { bf, events } = field([a], [first, second])
    a.target = second.id
    performMove(bf, a, seqRng(0.1))
    expect(events.find((e) => e.kind === EventKind.Hit)?.target).toBe(second.id)
    second.hp = 0
    expect(pickedTarget(a, [first])).toBeUndefined()
  })

  it('golpes y estados a un rival; curas a un aliado; los de área o al grupo, sin objetivo', () => {
    expect(pickSide(battleMove(HIT))).toBe(PickSide.Foes)
    expect(pickSide({ ...supportOf(MoveKind.Heal), area: false })).toBe(PickSide.Allies)
    expect(pickSide({ ...supportOf(MoveKind.Heal), area: true })).toBeNull()
    expect(pickSide({ ...supportOf(MoveKind.Inflict), area: false })).toBe(PickSide.Foes)
    expect(pickSide(supportOf(MoveKind.Boost))).toBeNull()
  })
})

import { describe, expect, it } from 'vitest'
import { area, EffectKind, healAlly, healTeam, IMOVE, incursionMove, inflict, move, raise, type MoveEffect } from '../../data/incursionMoves'
import { StatusId } from '../../data/passives'
import { ally, enemy, field, HIT } from './incursion-test-utils'
import { applyPicks, pickedTarget, PickSide, pickSide } from './movePicks'
import { performMove } from './moveEffects'
import { seqRng } from '../core/test-utils'
import { EventKind } from './events'

const HEAL_ID = Object.values(IMOVE).find((mv) => mv.effects.some((e) => e.kind === EffectKind.HealAlly))!.id
const test = (power: number, ...effects: MoveEffect[]) => move('prueba', 'Prueba', 'normal', power, effects)

describe('elegir ataque y objetivo', () => {
  it('cambia el ataque y el objetivo del Pokémon del grupo; un ataque que no existe se ignora', () => {
    const a = ally('a')
    const heal = incursionMove(HEAL_ID)
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
    expect(pickSide(incursionMove(HIT))).toBe(PickSide.Foes)
    expect(pickSide(test(40, area()))).toBeNull()
    expect(pickSide(test(40, healAlly(1)))).toBe(PickSide.Allies)
    expect(pickSide(test(40, healTeam(1)))).toBeNull()
    expect(pickSide(test(0, inflict(StatusId.Burn)))).toBe(PickSide.Foes)
    expect(pickSide(test(0, inflict(StatusId.Burn), area()))).toBeNull()
    expect(pickSide(test(0, raise([{ stat: 'atk', stages: 1 }])))).toBeNull()
  })
})

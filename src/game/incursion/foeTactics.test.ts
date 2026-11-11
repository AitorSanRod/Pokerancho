import { describe, expect, it } from 'vitest'
import { healAlly, inflict, move, raise, raiseSelf, taunt, type IncursionMove } from '../../data/incursionMoves'
import { StatusId } from '../../data/passives'
import { seqRng } from '../core/test-utils'
import { ally, enemy, field } from './incursion-test-utils'
import { chooseFoeMove, FOE_HEAL_BELOW, isUseful, stillUseful } from './foeTactics'
import { inflict as afflict } from './groupStatus'
import { MAX_STAGES } from './statStages'

// Ataques de prueba, para no depender de los datos
const HIT = move('prueba-golpe', 'Golpe', 'normal', 40)
const CONFUSE = move('prueba-confundir', 'Confundir', 'normal', 0, [inflict(StatusId.Confusion)])
const HEAL = move('prueba-cura', 'Cura', 'normal', 40, [healAlly(1)])
const DANCE = move('prueba-danza', 'Danza', 'normal', 0, [raiseSelf([{ stat: 'atk', stages: 1 }])])
const CHEER = move('prueba-animo', 'Ánimo', 'normal', 0, [raise([{ stat: 'def', stages: 1 }])])
const GUARD = move('prueba-guardia', 'Guardia', 'normal', 0, [taunt(0.3)])

const foeWith = (id: string, moves: IncursionMove[]) => Object.assign(enemy(id), { moves, move: moves[0] })

describe('ataques de los rivales', () => {
  it('no pone un estado si todos los del grupo ya tienen uno', () => {
    const a = ally('a')
    const foe = foeWith('e', [CONFUSE, HIT])
    const { bf } = field([a], [foe])
    expect(isUseful(bf, foe, CONFUSE)).toBe(true)
    afflict(bf, a, StatusId.Confusion)
    expect(isUseful(bf, foe, CONFUSE)).toBe(false)
    for (let r = 0; r < 1; r += 0.1) expect(chooseFoeMove(bf, foe, seqRng(r), false)).toBe(HIT)
  })

  it('no sube una stat que ya está al tope, ni provoca si ya provoca', () => {
    const foe = foeWith('e', [DANCE, CHEER, GUARD])
    const { bf } = field([ally('a')], [foe])
    foe.stages.atk = MAX_STAGES
    expect(isUseful(bf, foe, DANCE)).toBe(false)
    expect(isUseful(bf, foe, CHEER)).toBe(true)
    foe.taunt = { turns: 2, guard: 0.3 }
    expect(isUseful(bf, foe, GUARD)).toBe(false)
  })

  it('cura cuando a alguien de su bando le hace falta; si no, no', () => {
    const foe = foeWith('e', [HIT, HEAL])
    const { bf } = field([ally('a')], [foe])
    expect(isUseful(bf, foe, HEAL)).toBe(false)
    foe.hp = Math.floor(foe.maxHp * FOE_HEAL_BELOW) - 1
    for (let r = 0; r < 1; r += 0.1) expect(chooseFoeMove(bf, foe, seqRng(r), false)).toBe(HEAL)
  })

  it('en un turno de golpe en área usa uno de daño', () => {
    const foe = foeWith('e', [CONFUSE, HIT])
    const { bf } = field([ally('a')], [foe])
    for (let r = 0; r < 1; r += 0.1) expect(chooseFoeMove(bf, foe, seqRng(r), true)).toBe(HIT)
  })

  it('si otro se adelantó y su ataque ya no hace nada, cambia a otro', () => {
    const a = ally('a')
    const foe = foeWith('e', [CONFUSE, HIT])
    const { bf } = field([a], [foe])
    foe.move = CONFUSE
    afflict(bf, a, StatusId.Confusion)
    expect(stillUseful(bf, foe, seqRng(0.5), false)).toBe(HIT)
  })
})

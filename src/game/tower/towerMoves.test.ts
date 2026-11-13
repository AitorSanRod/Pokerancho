import { describe, expect, it } from 'vitest'
import { moveClass, MoveClass } from '../../data/incursionMoves'
import { signatureMove } from '../../data/moves'
import { POKEMON } from '../../data/pokemon'
import { activeMon, initialState } from '../core/state'
import { chooseStarter } from '../core/test-utils'
import { MAX_LEVEL } from '../team/stats'
import { towerMove, towerMoveChoices } from './towerMoves'

function mon() {
  const s = initialState()
  chooseStarter(s, POKEMON.Charmander)
  const m = activeMon(s)!
  m.level = MAX_LEVEL
  return m
}

describe('ataques de la torre', () => {
  it('se elige entre los de daño de su repertorio', () => {
    const choices = towerMoveChoices(mon())
    expect(choices.length).toBeGreaterThan(0)
    expect(choices.every((mv) => moveClass(mv) === MoveClass.Damage)).toBe(true)
  })

  it('se usa con su tipo, potencia y precisión; si no lo sabe, el suyo de siempre', () => {
    const m = mon()
    const chosen = towerMoveChoices(m)[0]
    expect(towerMove(m, chosen.id)).toEqual({ id: chosen.id, name: chosen.name, type: chosen.type, power: chosen.power, accuracy: chosen.accuracy })
    expect(towerMove(m, 'no-existe')).toEqual(signatureMove(m.speciesId))
  })
})

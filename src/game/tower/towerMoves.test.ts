import { describe, expect, it } from 'vitest'
import { moveClass, MoveClass } from '../../data/incursionMoves'
import { POKEMON } from '../../data/pokemon'
import { activeMon, initialState } from '../core/state'
import { chooseStarter } from '../core/test-utils'
import { MAX_LEVEL } from '../team/stats'
import { combatStrike, towerMove, towerMoveChoices } from './towerMoves'

function mon() {
  const s = initialState()
  chooseStarter(s, POKEMON.Charmander)
  const m = activeMon(s)!
  m.level = MAX_LEVEL
  return m
}

describe('ataques de la torre', () => {
  it('se elige entre los de daño de su repertorio de combate', () => {
    const choices = towerMoveChoices(mon())
    expect(choices.length).toBeGreaterThan(0)
    expect(choices.every((mv) => moveClass(mv) === MoveClass.Damage)).toBe(true)
  })

  it('se usa con su tipo, potencia, precisión, prioridad y efectos; si ya no lo lleva, el primero de los que lleva', () => {
    const m = mon()
    const chosen = towerMoveChoices(m)[0]
    expect(towerMove(m, chosen.id)).toEqual(combatStrike(chosen))
    expect(towerMove(m, chosen.id)).toMatchObject({ power: chosen.power, accuracy: chosen.accuracy, priority: chosen.priority, effects: chosen.effects })
    expect(towerMove(m, 'no-existe')).toEqual(combatStrike(chosen))
  })
})

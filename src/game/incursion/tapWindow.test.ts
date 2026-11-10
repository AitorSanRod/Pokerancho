import { describe, expect, it } from 'vitest'
import { ally, enemy, field } from './incursion-test-utils'
import { move, raise } from '../../data/incursionMoves'
import { anyPlayerUp, tapMult } from './tapWindow'

describe('ventana de toques', () => {
  it('se abre si queda en pie algún Pokémon de un jugador; los bots no tocan', () => {
    const player = ally('mon0')
    const bot = ally('bot-0')
    expect(anyPlayerUp(field([player, bot], [enemy('e')]).bf)).toBe(true)
    player.hp = 0
    expect(anyPlayerUp(field([player, bot], [enemy('e')]).bf)).toBe(false)
  })

  it('el que potenció su ataque suma la mejora de su ataque; el resto, igual', () => {
    const [a, b] = [ally('a'), ally('b')]
    const { bf } = field([a, b], [enemy('e')])
    bf.boosted = ['a']
    expect(tapMult(bf, a)).toBe(1 + a.move.tapBonus)
    expect(tapMult(bf, b)).toBe(1)
  })

  it('los de estado potenciados no mejoran lo suyo: suman su mejora a cada compañero, y se acumulan', () => {
    const support = () => Object.assign(ally('s'), { move: move('prueba', 'Prueba', 'normal', 0, [raise([{ stat: 'atk', stages: 1 }])]) })
    const [a, s1, s2] = [ally('a'), Object.assign(support(), { id: 's1' }), Object.assign(support(), { id: 's2' })]
    const { bf } = field([a, s1, s2], [enemy('e')])
    bf.boosted = ['s1', 's2']
    expect(tapMult(bf, a)).toBeCloseTo(1 + s1.move.tapBonus + s2.move.tapBonus)
    expect(tapMult(bf, s1)).toBeCloseTo(1 + s2.move.tapBonus)
  })

  it('a los rivales no les afecta', () => {
    const foe = enemy('e')
    const { bf } = field([ally('a')], [foe])
    bf.boosted = ['e', 'a']
    expect(tapMult(bf, foe)).toBe(1)
  })
})

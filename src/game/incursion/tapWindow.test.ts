import { describe, expect, it } from 'vitest'
import { ally, enemy, field } from './incursion-test-utils'
import { anyPlayerUp, TAP_BONUS, tapMult } from './tapWindow'

describe('ventana de toques', () => {
  it('se abre si queda en pie algún Pokémon de un jugador; los bots no tocan', () => {
    const player = ally('mon0')
    const bot = ally('bot-0')
    expect(anyPlayerUp(field([player, bot], [enemy('e')]).bf)).toBe(true)
    player.hp = 0
    expect(anyPlayerUp(field([player, bot], [enemy('e')]).bf)).toBe(false)
  })

  it('el que potenció su ataque pega un TAP_BONUS más; el resto, igual', () => {
    const { bf } = field([ally('a'), ally('b')], [enemy('e')])
    bf.boosted = ['a']
    expect(tapMult(bf, 'a')).toBe(1 + TAP_BONUS)
    expect(tapMult(bf, 'b')).toBe(1)
  })
})

import { describe, expect, it } from 'vitest'
import type { Move } from '../../data/moves'
import { POKEMON } from '../../data/pokemon'
import { PokeType } from '../../data/types'
import { seqRng } from '../core/test-utils'
import { bestMove } from './attack'
import { makeFighter, simulateBattle } from './battle'

const move = (id: string, type: PokeType, power: number, accuracy = 100): Move => ({ id, name: id, type, power, accuracy })

describe('ataques a elegir (Pokémon de los líderes)', () => {
  const atk = makeFighter('enemy', POKEMON.Squirtle, 30)
  const def = makeFighter('player', POKEMON.Charmander, 30)

  it('elige el que más daño espera hacer: eficacia, potencia y precisión', () => {
    const weak = move('weak', PokeType.Normal, 40)
    const effective = move('effective', PokeType.Water, 40)
    expect(bestMove([weak, effective], atk, def)).toBe(effective)
    const inaccurate = move('inaccurate', PokeType.Water, 60, 30)
    expect(bestMove([effective, inaccurate], atk, def)).toBe(effective)
  })

  it('en combate usa el elegido y lo apunta en su ataque', () => {
    const effective = move('effective', PokeType.Water, 40)
    const enemy = { ...makeFighter('enemy', POKEMON.Squirtle, 30), movePool: [move('weak', PokeType.Normal, 40), effective] }
    const { events } = simulateBattle(makeFighter('player', POKEMON.Charmander, 30), enemy, seqRng(0.5))
    const used = events.filter((e) => e.kind === 'attack' && e.side === 'enemy')
    expect(used.length).toBeGreaterThan(0)
    expect(used.every((e) => e.move === effective)).toBe(true)
  })
})

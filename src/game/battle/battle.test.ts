import { describe, expect, it } from 'vitest'
import { signatureMove, STRUGGLE_DAMAGE, STRUGGLE_RECOIL } from '../../data/moves'
import { POKEMON } from '../../data/pokemon'
import { SPECIES } from '../../data/species'
import { effectiveness } from '../../data/types'
import { seqRng } from '../core/test-utils'
import { calcStats } from '../team/stats'
import { attack } from './attack'
import { makeFighter, simulateBattle, type Push } from './battle'

const LEVEL = 30
/** Primera pareja de especies en la que el ataque de una no afecta a la otra */
const IMMUNE = SPECIES.flatMap((a) =>
  SPECIES.filter((d) => effectiveness(signatureMove(a.id).type, d.types) === 0).map((d) => [a.id, d.id]),
)[0]
const BY_SPEED = [...SPECIES].sort((a, b) => calcStats(b.id, LEVEL).spe - calcStats(a.id, LEVEL).spe)


describe('simulateBattle', () => {
  it('un Pokémon muy superior gana', () => {
    const player = makeFighter('player', POKEMON.Charmander, 50)
    const enemy = makeFighter('enemy', POKEMON.Bulbasaur, 2)
    const result = simulateBattle(player, enemy, seqRng(0.5))
    expect(result.outcome).toBe('win')
    expect(result.events.at(-1)?.kind).toBe('faint')
  })

  it.runIf(IMMUNE)('si su ataque no afecta al rival, forcejea: daño fijo al rival y retroceso a sí mismo', () => {
    const player = makeFighter('player', IMMUNE[0], 50)
    const enemy = makeFighter('enemy', IMMUNE[1], 50)
    const result = simulateBattle(player, enemy, seqRng(0.5))
    const at = result.events.findIndex((e) => e.kind === 'attack' && e.side === 'player')
    const [before, attackEvent, onEnemy, recoil] = result.events.slice(at - 1, at + 3)
    expect(attackEvent.struggle).toBe(true)
    expect(onEnemy).toMatchObject({ kind: 'hit', side: 'enemy', struggle: true })
    expect(before.enemyHp - onEnemy.enemyHp).toBe(Math.min(before.enemyHp, STRUGGLE_DAMAGE))
    expect(recoil).toMatchObject({ kind: 'hit', side: 'player', struggle: true })
    expect(onEnemy.playerHp - recoil.playerHp).toBe(Math.min(onEnemy.playerHp, Math.ceil(player.maxHp * STRUGGLE_RECOIL)))
    expect(result.events.some((e) => e.kind === 'miss' && e.miss === 'immune')).toBe(false)
  })

  it.runIf(IMMUNE)('el retroceso de Forcejeo puede debilitar a quien lo usa', () => {
    const player = makeFighter('player', IMMUNE[0], 50, { hp: 1 })
    const enemy = makeFighter('enemy', IMMUNE[1], 50)
    const events: Parameters<Push>[0][] = []
    attack(player, enemy, (e) => events.push(e), seqRng(0.5))
    expect(player.hp).toBe(0)
    expect(events.at(-1)).toMatchObject({ kind: 'faint', side: 'player' })
  })

  it('un ataque que sí afecta no forcejea', () => {
    const player = makeFighter('player', POKEMON.Charmander, 20)
    const enemy = makeFighter('enemy', POKEMON.Bulbasaur, 20)
    const result = simulateBattle(player, enemy, seqRng(0.5))
    expect(result.events.some((e) => e.struggle)).toBe(false)
  })

  it('cada golpe de un ataque dice su eficacia y si fue crítico', () => {
    const player = makeFighter('player', POKEMON.Charmander, 20)
    const enemy = makeFighter('enemy', POKEMON.Bulbasaur, 20)
    const result = simulateBattle(player, enemy, seqRng(0.5))
    const hit = result.events.find((e) => e.kind === 'hit' && e.side === 'enemy')!
    expect(hit.eff).toBe(effectiveness(signatureMove(POKEMON.Charmander).type, enemy.types))
    expect(hit.crit).toBe(false)
  })

  it('el más rápido ataca primero', () => {
    const fast = makeFighter('player', BY_SPEED[0].id, LEVEL)
    const slow = makeFighter('enemy', BY_SPEED.at(-1)!.id, LEVEL)
    const result = simulateBattle(fast, slow, seqRng(0.5))
    expect(result.events.find((e) => e.kind === 'attack')?.side).toBe('player')
  })

  it('cada evento refleja los PS de ambos tras ocurrir', () => {
    const player = makeFighter('player', POKEMON.Charmander, 20)
    const enemy = makeFighter('enemy', POKEMON.Bulbasaur, 20)
    const result = simulateBattle(player, enemy, seqRng(0.3, 0.7))
    expect(result.events.at(-1)!.playerHp).toBe(result.playerHp)
  })
})

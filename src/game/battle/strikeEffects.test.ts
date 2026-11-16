import { describe, expect, it } from 'vitest'
import { area, drain, inflict, lower, move, raise, raiseSelf, taunt, type MoveEffect } from '../../data/incursionMoves'
import { StatusId } from '../../data/passives'
import { POKEMON } from '../../data/pokemon'
import { PokeType } from '../../data/types'
import { seqRng } from '../core/test-utils'
import { combatStrike } from '../tower/towerMoves'
import { AREA_DAMAGE_MULT, attack } from './attack'
import { makeFighter, simulateBattle, type BattleEvent, type Push } from './battle'
import { MAX_STAGES } from './statStages'

// Ataques de prueba hechos con el mismo constructor que los de verdad, para no depender de los datos
const strike = (effects: MoveEffect[], opts: { power?: number; accuracy?: number; priority?: number } = {}) =>
  combatStrike(move('test', 'Prueba', PokeType.Normal, opts.power ?? 40, effects, opts))

const LEVEL = 50

function duel(effects: MoveEffect[], opts: Parameters<typeof strike>[1] = {}) {
  const atk = makeFighter('player', POKEMON.Snorlax, LEVEL, { move: strike(effects, opts) })
  const def = makeFighter('enemy', POKEMON.Snorlax, LEVEL)
  const events: BattleEvent[] = []
  const push: Push = (e) => events.push({ ...e, playerHp: atk.hp, enemyHp: def.hp, playerStatus: atk.status, enemyStatus: def.status })
  return { atk, def, events, hit: () => attack(atk, def, push, seqRng(0.5)) }
}

describe('efectos del ataque de combate en ruta y torre', () => {
  it('drenar: recupera esa parte del daño hecho', () => {
    const { atk, def, hit } = duel([drain(0.5)])
    atk.hp = 1
    hit()
    const dealt = def.maxHp - def.hp
    expect(atk.hp - 1).toBe(Math.ceil(dealt * 0.5))
  })

  it('poner estado: con su probabilidad, al golpeado', () => {
    const sure = duel([inflict(StatusId.Burn, 1)])
    sure.hit()
    expect(sure.def.status).toBe(StatusId.Burn)
    const never = duel([inflict(StatusId.Burn, 0)])
    never.hit()
    expect(never.def.status).toBeNull()
  })

  it('bajar stats al golpeado y subirlas a quien ataca (también las que en la incursión suben al grupo)', () => {
    const { atk, def, events, hit } = duel([lower([{ stat: 'def', stages: -1 }]), raiseSelf([{ stat: 'atk', stages: 2 }]), raise([{ stat: 'spe', stages: 1 }])])
    hit()
    expect(def.stages.def).toBe(-1)
    expect(atk.stages).toMatchObject({ atk: 2, spe: 0 })
    expect(events.filter((e) => e.kind === 'stat').length).toBeGreaterThan(0)
  })

  it('subir stats vale aunque falle; sin pasar del tope', () => {
    const { atk, hit } = duel([raiseSelf([{ stat: 'atk', stages: MAX_STAGES }])], { accuracy: 0 })
    hit()
    hit()
    expect(atk.stages.atk).toBe(MAX_STAGES)
  })

  it('las etapas de Ataque del atacante y de Defensa del rival cuentan en el daño', () => {
    const plain = duel([])
    plain.hit()
    const boosted = duel([])
    boosted.atk.stages.atk = 2
    boosted.hit()
    const guarded = duel([])
    guarded.def.stages.def = 2
    guarded.hit()
    const lost = (d: ReturnType<typeof duel>) => d.def.maxHp - d.def.hp
    expect(lost(boosted)).toBeGreaterThan(lost(plain))
    expect(lost(guarded)).toBeLessThan(lost(plain))
  })

  it('los de área dan al único rival con menos daño; provocar no hace nada', () => {
    const single = duel([])
    single.hit()
    const spread = duel([area()])
    spread.hit()
    const lost = (d: ReturnType<typeof duel>) => d.def.maxHp - d.def.hp
    expect(lost(spread)).toBeLessThanOrEqual(Math.ceil(lost(single) * AREA_DAMAGE_MULT))
    const taunting = duel([taunt(0.5)])
    taunting.hit()
    expect(lost(taunting)).toBe(lost(single))
  })

  it('con más prioridad actúa antes aunque sea más lento', () => {
    const slow = makeFighter('player', POKEMON.Snorlax, LEVEL, { move: strike([], { priority: 1 }) })
    slow.stats.spe = 1
    const { events } = simulateBattle(slow, makeFighter('enemy', POKEMON.Snorlax, LEVEL), seqRng(0.5))
    expect(events.find((e) => e.kind === 'attack')!.side).toBe('player')
  })
})

import { describe, expect, it } from 'vitest'
import { CRIT_MULT, STATUS_INFO, StatusId, TYPE_PASSIVES } from '../../data/passives'
import { POKEMON } from '../../data/pokemon'
import { seqRng } from '../core/test-utils'
import { calcStats } from '../team/stats'
import { makeFighter, simulateBattle } from './battle'
import { cappedHit, combineBonus, sumEffects } from './combatBonus'

const LEVEL = 30
const SPECIES_ID = POKEMON.Charmander
const RIVAL_ID = POKEMON.Bulbasaur

describe('combineBonus', () => {
  it('suma las pasivas tal cual y acumula sus estados', () => {
    const passives = [
      { type: 'fighting', level: 1 },
      { type: 'flying', level: 3 },
      { type: 'fire', level: 2 },
    ] as const
    const bonus = combineBonus([...passives])
    expect(bonus).toEqual(sumEffects(passives.map((p) => TYPE_PASSIVES[p.type][p.level - 1])))
    expect(bonus.inflicts).toHaveLength(passives.filter((p) => TYPE_PASSIVES[p.type][p.level - 1].inflict).length)
  })

  it('el tope de golpe se queda con el más bajo; sin pasiva, no hay tope', () => {
    expect(sumEffects([]).maxHitTaken).toBe(1)
    expect(sumEffects([{ maxHitTaken: 0.9 }, { maxHitTaken: 0.7 }]).maxHitTaken).toBe(0.7)
  })

  it('ningún golpe pasa del tope de sus PS máximos, y el que no llega no cambia', () => {
    const bonus = sumEffects([{ maxHitTaken: 0.7 }])
    expect(cappedHit(500, bonus, 100)).toBe(70)
    expect(cappedHit(30, bonus, 100)).toBe(30)
    expect(cappedHit(500, sumEffects([]), 100)).toBe(500)
  })

  it('sin pasivas no cambia nada', () => {
    const plain = makeFighter('player', SPECIES_ID, LEVEL)
    expect(plain.stats).toEqual(calcStats(SPECIES_ID, LEVEL))
  })
})

describe('pasivas en combate', () => {
  it('las de stats suben la stat en su porcentaje, y los PS actuales en proporción', () => {
    const base = calcStats(SPECIES_ID, LEVEL)
    const f = makeFighter('player', SPECIES_ID, LEVEL, { hp: base.hp, passives: [{ type: 'normal', level: 1 }] })
    expect(f.maxHp).toBe(Math.round(base.hp * (1 + TYPE_PASSIVES.normal[0].hp!)))
    expect(f.hp).toBe(f.maxHp)
  })

  it('un golpe que acierta puede infligir un estado, y el estado se anuncia', () => {
    const player = makeFighter('player', SPECIES_ID, 50, { passives: [{ type: 'fire', level: 2 }] })
    const enemy = makeFighter('enemy', RIVAL_ID, 50)
    // 0.01: acierta, daño mínimo y siempre por debajo de la probabilidad de quemar
    const result = simulateBattle(player, enemy, seqRng(0.01))
    expect(result.events.some((e) => e.kind === 'status' && e.side === 'enemy' && e.status === StatusId.Burn)).toBe(true)
  })

  it('desde que recibe un estado, cada evento lo lleva en su lado', () => {
    const player = makeFighter('player', SPECIES_ID, 50, { passives: [{ type: 'fire', level: 2 }] })
    const enemy = makeFighter('enemy', RIVAL_ID, 50)
    const { events } = simulateBattle(player, enemy, seqRng(0.01))
    const inflicted = events.findIndex((e) => e.kind === 'status' && e.side === 'enemy')
    expect(events.slice(0, inflicted).every((e) => e.enemyStatus === null)).toBe(true)
    expect(events.slice(inflicted).every((e) => e.enemyStatus === StatusId.Burn)).toBe(true)
    expect(events.every((e) => e.playerStatus === null)).toBe(true)
  })

  it('la quemadura quita PS al final de cada turno', () => {
    const player = makeFighter('player', SPECIES_ID, 50, { passives: [{ type: 'fire', level: 2 }] })
    const enemy = makeFighter('enemy', RIVAL_ID, 50)
    const result = simulateBattle(player, enemy, seqRng(0.01))
    const burnHits = result.events.filter((e) => e.kind === 'hit' && e.side === 'enemy' && e.status === StatusId.Burn)
    expect(burnHits.length).toBeGreaterThan(0)
    expect(STATUS_INFO.burn.damagePerTurn).toBeGreaterThan(0)
  })

  it('un congelado pierde su turno', () => {
    const player = makeFighter('player', SPECIES_ID, 50, { passives: [{ type: 'ice', level: 2 }] })
    const enemy = makeFighter('enemy', RIVAL_ID, 50)
    const result = simulateBattle(player, enemy, seqRng(0.01))
    expect(result.events.some((e) => e.kind === 'status' && e.side === 'enemy' && e.text.includes('congelado y no'))).toBe(true)
  })

  it('con esquiva segura el rival nunca le da', () => {
    const player = makeFighter('player', SPECIES_ID, LEVEL)
    player.bonus.dodge = 1
    const enemy = makeFighter('enemy', RIVAL_ID, LEVEL)
    const result = simulateBattle(player, enemy, seqRng(0.5))
    expect(result.events.filter((e) => e.kind === 'hit' && e.side === 'player')).toHaveLength(0)
  })

  it('el crítico multiplica el daño', () => {
    const hitOf = (crit: number) => {
      const player = makeFighter('player', SPECIES_ID, LEVEL)
      player.bonus.crit = crit
      const enemy = makeFighter('enemy', RIVAL_ID, LEVEL)
      enemy.stats.spe = 1
      const result = simulateBattle(player, enemy, seqRng(0.5))
      const hit = result.events.findIndex((e) => e.kind === 'hit' && e.side === 'enemy')
      return enemy.maxHp - result.events[hit].enemyHp
    }
    expect(hitOf(1)).toBeGreaterThanOrEqual(Math.floor(hitOf(0) * CRIT_MULT) - 1)
    expect(hitOf(1)).toBeGreaterThan(hitOf(0))
  })

  it('la reducción de daño hace que reciba menos', () => {
    const lostWith = (reduction: number) => {
      const player = makeFighter('player', SPECIES_ID, LEVEL)
      player.bonus.damageReduction = reduction
      player.stats.spe = 1
      const enemy = makeFighter('enemy', RIVAL_ID, LEVEL)
      const result = simulateBattle(player, enemy, seqRng(0.5))
      const hit = result.events.find((e) => e.kind === 'hit' && e.side === 'player')!
      return player.maxHp - hit.playerHp
    }
    expect(lostWith(0.5)).toBeLessThan(lostWith(0))
  })

  it('el robo de vida cura al atacar', () => {
    const player = makeFighter('player', SPECIES_ID, LEVEL, { hp: 1, passives: [{ type: 'grass', level: 2 }] })
    const enemy = makeFighter('enemy', RIVAL_ID, LEVEL)
    const result = simulateBattle(player, enemy, seqRng(0.5))
    expect(result.events.some((e) => e.kind === 'heal' && e.side === 'player')).toBe(true)
  })

  it('con tope de golpe, un ataque nunca le quita más de esa parte de sus PS máximos', () => {
    const player = makeFighter('player', SPECIES_ID, 5)
    player.bonus.maxHitTaken = 0.1
    player.stats.spe = 1
    const enemy = makeFighter('enemy', RIVAL_ID, 80)
    const { events } = simulateBattle(player, enemy, seqRng(0.5))
    const hit = events.find((e) => e.kind === 'hit' && e.side === 'player')!
    expect(player.maxHp - hit.playerHp).toBe(Math.ceil(player.maxHp * 0.1))
  })

  it('al derrotar al rival con un ataque se cura su parte de los PS máximos', () => {
    const player = makeFighter('player', SPECIES_ID, 80, { hp: 10 })
    player.bonus.koHeal = 0.25
    const enemy = makeFighter('enemy', RIVAL_ID, 2)
    const { events } = simulateBattle(player, enemy, seqRng(0.5))
    const faint = events.findIndex((e) => e.kind === 'faint' && e.side === 'enemy')
    expect(events[faint + 1]).toMatchObject({ kind: 'heal', side: 'player', playerHp: 10 + Math.ceil(player.maxHp * 0.25) })
  })

  it('subiendo Velocidad con cada ataque acaba adelantando a un rival más rápido', () => {
    const player = makeFighter('player', SPECIES_ID, LEVEL)
    player.bonus.speedPerAttack = 1
    const enemy = makeFighter('enemy', RIVAL_ID, LEVEL)
    enemy.stats.spe = player.stats.spe * 2
    for (const f of [player, enemy]) f.stats.atk = 1
    const { events } = simulateBattle(player, enemy, seqRng(0.5))
    const attackers = events.filter((e) => e.kind === 'attack').map((e) => e.side)
    // Con +3 etapas (×2,5) ya pasa al rival, que va al doble: desde el cuarto turno, ataca primero
    expect(attackers.slice(0, 2)).toEqual(['enemy', 'player'])
    expect(attackers.slice(6, 8)).toEqual(['player', 'enemy'])
  })
})

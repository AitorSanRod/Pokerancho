import { describe, expect, it } from 'vitest'
import { ally, enemy, field } from './incursion-test-utils'
import { move, raise, TapKind, type TapChallenge } from '../../data/incursionMoves'
import { tapChallengeOf } from './tapChallenge'
import { anyPlayerUp, LEGACY_TAP_BONUS, perfectStrikers, STATUS_PERFECT_MULT, tapMult, tapPerfect, withoutTap } from './tapWindow'

const MASH: TapChallenge = { kind: TapKind.Mash, goal: 10, bonus: 0.1 }
const RINGS: TapChallenge = { kind: TapKind.Rings, min: 1, max: 3, bonus: 0.2 }
const striker = (id: string, tap: TapChallenge) => Object.assign(ally(id), { move: move(`m-${id}`, 'Prueba', 'normal', 40, [], { tap }) })
const support = (id: string, tap: TapChallenge) => Object.assign(ally(id), { move: move(`s-${id}`, 'Prueba', 'normal', 0, [raise([{ stat: 'atk', stages: 1 }])], { tap }) })

describe('ventana de toques', () => {
  it('se abre si queda en pie algún Pokémon de un jugador; los bots no tocan', () => {
    const player = ally('mon0')
    const bot = ally('bot-0')
    expect(anyPlayerUp(field([player, bot], [enemy('e')]).bf)).toBe(true)
    player.hp = 0
    expect(anyPlayerUp(field([player, bot], [enemy('e')]).bf)).toBe(false)
  })

  it('la mejora va según lo conseguido: con media meta, media mejora; el que no tocó, igual', () => {
    const [a, b] = [striker('a', MASH), striker('b', MASH)]
    const { bf } = field([a, b], [enemy('e')])
    bf.taps = { a: 0.5 }
    expect(tapMult(bf, a)).toBeCloseTo(1 + MASH.bonus * 0.5)
    expect(tapMult(bf, b)).toBe(1)
  })

  it('con parte de los anillos mejora por esa parte; con todos, la mejora va como crítico de su primer golpe', () => {
    const a = striker('a', RINGS)
    const { bf } = field([a], [enemy('e')])
    bf.taps = { a: 2 / 3 }
    expect(tapMult(bf, a)).toBeCloseTo(1 + (RINGS.bonus * 2) / 3)
    expect(perfectStrikers(bf)).toEqual([])
    bf.taps = { a: 1 }
    expect(tapMult(bf, a)).toBe(1)
    expect(tapPerfect(bf, a)).toBe(true)
    expect(perfectStrikers(bf)).toEqual(['a'])
  })

  it('machacar entero no es crítico', () => {
    const a = striker('a', MASH)
    const { bf } = field([a], [enemy('e')])
    bf.taps = { a: 1 }
    expect(tapPerfect(bf, a)).toBe(false)
    expect(tapMult(bf, a)).toBeCloseTo(1 + MASH.bonus)
  })

  it('los de estado no mejoran lo suyo: suman a cada compañero, se acumulan y con todos los anillos dan más', () => {
    const [a, s1, s2] = [striker('a', MASH), support('s1', RINGS), support('s2', MASH)]
    const { bf } = field([a, s1, s2], [enemy('e')])
    bf.taps = { s1: 0.5, s2: 1 }
    expect(tapMult(bf, a)).toBeCloseTo(1 + RINGS.bonus * 0.5 + MASH.bonus)
    expect(tapMult(bf, s1)).toBeCloseTo(1 + MASH.bonus)
    bf.taps = { s1: 1 }
    expect(tapMult(bf, a)).toBeCloseTo(1 + RINGS.bonus * STATUS_PERFECT_MULT)
    expect(perfectStrikers(bf)).toEqual([])
  })

  it('las órdenes de antes de los retos se repiten igual: quien llegó a los toques, la mejora de entonces y sin crítico', () => {
    const [a, s1] = [striker('a', RINGS), support('s1', RINGS)]
    const { bf } = field([a, s1], [enemy('e')])
    bf.boosted = ['a', 's1']
    expect(tapMult(bf, a)).toBeCloseTo(1 + LEGACY_TAP_BONUS * 2)
    expect(tapMult(bf, s1)).toBe(1)
    expect(perfectStrikers(bf)).toEqual([])
  })

  it('a los rivales no les afecta', () => {
    const foe = Object.assign(enemy('e'), { move: move('f', 'F', 'normal', 40, [], { tap: RINGS }) })
    const { bf } = field([ally('a')], [foe])
    bf.taps = { e: 1, a: 1 }
    expect(tapMult(bf, foe)).toBe(1)
    expect(tapPerfect(bf, foe)).toBe(false)
  })

  it('el reto de cada ataque es el suyo a mano si lo lleva', () => {
    expect(tapChallengeOf(striker('a', RINGS).move)).toBe(RINGS)
  })

  it('quitar la puntuación de uno deja la del resto', () => {
    expect(withoutTap({ a: 1, b: 0.5 }, 'a')).toEqual({ b: 0.5 })
  })
})

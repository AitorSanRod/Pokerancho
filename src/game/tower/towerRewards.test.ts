import { describe, expect, it } from 'vitest'
import { POKEMON } from '../../data/pokemon'
import { SPECIES } from '../../data/species'
import { TOWER_LATE_PRIZE, TOWER_PRIZE_EVERY, TOWER_PRIZES } from '../../data/towerPrizes'
import { piecesOf } from '../collection/pieces'
import { activeMon, initialState } from '../core/state'
import { chooseStarter } from '../core/test-utils'
import { TOWER_LEVEL_CAP_FLOOR } from './towerFoes'
import { floorExp, floorMoney, floorPrize, nextPrizeFloor, noTowerEarned, rewardFloor, TOWER_EGG_CHANCE, TOWER_EXP_LEVEL_CUTS, towerExpMult, towerPrize } from './towerRewards'

const FOE = SPECIES[5].id
/** Azar que nunca da el Huevo Suerte */
const NO_EGG = () => 1

function onFloor(floor: number, best = 0, level?: number) {
  const s = initialState()
  chooseStarter(s, POKEMON.Charmander)
  if (level) activeMon(s)!.level = level
  const earned = noTowerEarned()
  const money = s.money
  const tickets = s.tickets
  rewardFloor(s, activeMon(s)!, earned, FOE, floorPrize(floor, best, NO_EGG))
  return { s, earned, money: s.money - money, tickets: s.tickets - tickets }
}

describe('premios de la torre', () => {
  it('la EXP y el ₽ crecen piso a piso, también pasado el último de nivel', () => {
    for (const floor of [1, TOWER_LEVEL_CAP_FLOOR / 2, TOWER_LEVEL_CAP_FLOOR]) {
      expect(floorExp(floor + 1)).toBeGreaterThanOrEqual(floorExp(floor))
      expect(floorMoney(floor + 1)).toBeGreaterThanOrEqual(floorMoney(floor))
    }
    expect(floorExp(TOWER_LEVEL_CAP_FLOOR + 10)).toBeGreaterThan(floorExp(TOWER_LEVEL_CAP_FLOOR))
    expect(floorMoney(TOWER_LEVEL_CAP_FLOOR + 10)).toBeGreaterThan(floorMoney(TOWER_LEVEL_CAP_FLOOR))
  })

  it('un piso normal da su ₽ y su EXP, sin premio', () => {
    const r = onFloor(1)
    expect(r.money).toBe(floorMoney(1))
    expect(r.earned).toMatchObject({ money: floorMoney(1), exp: floorExp(1), pieces: [], prizes: [] })
  })

  it('la EXP se recorta según el nivel del Pokémon que sube; el ₽, no', () => {
    const lowest = Math.min(...TOWER_EXP_LEVEL_CUTS.map((c) => c.fromLevel))
    expect(towerExpMult(lowest - 1)).toBe(1)
    expect(onFloor(1, 0, lowest - 1).earned.exp).toBe(floorExp(1))
    for (const cut of TOWER_EXP_LEVEL_CUTS) {
      expect(towerExpMult(cut.fromLevel)).toBe(cut.mult)
      const r = onFloor(1, 0, cut.fromLevel)
      expect(r.earned.exp).toBe(Math.round(floorExp(1) * cut.mult))
      expect(r.money).toBe(floorMoney(1))
    }
  })

  it('el recorte usa el nivel con el que se gana el piso, antes de sumar su EXP', () => {
    const lowest = Math.min(...TOWER_EXP_LEVEL_CUTS.map((c) => c.fromLevel))
    const r = onFloor(TOWER_LEVEL_CAP_FLOOR, 0, lowest - 1)
    expect(r.earned.exp).toBe(floorExp(TOWER_LEVEL_CAP_FLOOR))
  })

  it('cada pocos pisos hay premio de la lista y, pasada ella, el de después', () => {
    expect(towerPrize(TOWER_PRIZE_EVERY)).toEqual(TOWER_PRIZES[0])
    expect(towerPrize(TOWER_PRIZE_EVERY + 1)).toBeNull()
    expect(towerPrize(TOWER_PRIZE_EVERY * (TOWER_PRIZES.length + 1))).toEqual(TOWER_LATE_PRIZE)
    expect(nextPrizeFloor(0)).toBe(TOWER_PRIZE_EVERY)
    expect(nextPrizeFloor(TOWER_PRIZE_EVERY)).toBe(TOWER_PRIZE_EVERY * 2)
  })

  it('el premio de piso solo se cobra la primera vez', () => {
    const first = onFloor(TOWER_PRIZE_EVERY, 0)
    const prize = TOWER_PRIZES[0]
    expect(first.money).toBe(floorMoney(TOWER_PRIZE_EVERY) + prize.money)
    expect(first.tickets).toBe(prize.tickets)
    expect(first.earned.prizes).toEqual([prize])
    expect(onFloor(TOWER_PRIZE_EVERY, TOWER_PRIZE_EVERY).earned.prizes).toEqual([])
  })

  it('pasado el último piso de nivel, cada rival da un ticket suyo', () => {
    expect(piecesOf(onFloor(TOWER_LEVEL_CAP_FLOOR).s, FOE)).toBe(0)
    const r = onFloor(TOWER_LEVEL_CAP_FLOOR + 1)
    expect(piecesOf(r.s, FOE)).toBe(1)
    expect(r.earned.pieces).toEqual([FOE])
  })

  it('a veces un piso saca un Huevo Suerte, pero cobrarlo no lo mete en la Mochila (hay que tocarlo)', () => {
    expect(floorPrize(1, 0, () => TOWER_EGG_CHANCE - 0.001).egg).toBe(true)
    expect(floorPrize(1, 0, () => TOWER_EGG_CHANCE).egg).toBe(false)
    const s = initialState()
    chooseStarter(s, POKEMON.Charmander)
    const earned = noTowerEarned()
    const eggs = s.luckyEggs
    rewardFloor(s, activeMon(s)!, earned, FOE, { ...floorPrize(1, 0, NO_EGG), egg: true })
    expect(s.luckyEggs).toBe(eggs)
    expect(earned.eggs).toBe(0)
  })
})

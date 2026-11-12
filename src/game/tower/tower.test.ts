import { describe, expect, it, vi } from 'vitest'
import { POKEMON } from '../../data/pokemon'
import type { Rng } from '../core/random'
import { activeMon, initialState, MonPlace, monPlace, type GameState } from '../core/state'
import { chooseStarter, seqRng } from '../core/test-utils'
import { MAX_LEVEL } from '../team/stats'
import { rankingWeek } from '../core/ranking'
import { runBlocker } from '../run/run'
import { expeditionBlocker } from '../team/expedition'
import { setActive } from '../team/ranch'
import {
  abandonTower,
  advanceTower,
  canContinueTower,
  canStartTower,
  isHealFloor,
  nextFloor,
  pickTowerMove,
  startTower,
  TOWER_HEAL_EVERY,
  TOWER_LAST_HEAL_FLOOR,
  towerBetweenFloors,
  TowerEnd,
  towerBlocker,
  towerMovePickDue,
  TOWER_AWAY_FLOORS,
  TOWER_AWAY_GAP_MS,
} from './tower'
import { towerWeekBest } from './towerWeek'
import { TOWER_MOVE_PICK_EVERY, towerMove, towerMoveChoices } from './towerMoves'
import { sideMove } from '../battle/battle'

vi.mock('../../data/maps/kantoMaps', () => import('../core/test-map'))

/** Pisos de sobra para que caiga */
const MANY_FLOORS = 1000

function withMon(level: number) {
  const s = initialState()
  chooseStarter(s, POKEMON.Charmander)
  activeMon(s)!.level = level
  return s
}

const firstMove = (s: GameState) => towerMoveChoices(activeMon(s)!)[0].id

/** Acaba el combate en curso, como si pasara el tiempo */
const finishBattle = (s: GameState) => advanceTower(s, s.tower!.battleMsLeft)

/** Sube piso a piso (eligiendo el mismo ataque cuando toca) hasta que cae o hasta `floors` pisos */
function climb(s: GameState, rng: Rng, floors = MANY_FLOORS) {
  for (let i = 0; i < floors && s.tower!.end === null; i++) {
    finishBattle(s)
    if (towerMovePickDue(s)) pickTowerMove(s, s.tower!.moveId)
    nextFloor(s, rng)
  }
}

describe('torre infinita', () => {
  it('se sube con el compañero, sin estar en una ruta y con un ataque que sabe', () => {
    expect(canStartTower(initialState())).toBe(false)
    const s = withMon(MAX_LEVEL)
    startTower(s, 'no-existe')
    expect(s.tower).toBeNull()
    s.run = {} as never
    startTower(s, firstMove(s))
    expect(s.tower).toBeNull()
    s.run = null
    startTower(s, firstMove(s), seqRng(0.3))
    expect(s.tower).toMatchObject({ uid: activeMon(s)!.uid, floor: 1, end: null })
    expect(s.tower!.battleMsLeft).toBeGreaterThan(0)
  })

  it('el combate lleva el ataque elegido, también para verlo', () => {
    const s = withMon(MAX_LEVEL)
    const choices = towerMoveChoices(activeMon(s)!)
    const chosen = choices.at(-1)!.id
    startTower(s, chosen, seqRng(0.3))
    expect(sideMove(s.tower!.lastBattle!.player)).toEqual(towerMove(activeMon(s)!, chosen))
  })

  it('al acabar un combate espera: el siguiente piso solo empieza cuando se pide', () => {
    const s = withMon(MAX_LEVEL)
    startTower(s, firstMove(s), seqRng(0.3))
    finishBattle(s)
    expect(towerBetweenFloors(s)).toBe(true)
    expect(s.tower!.floor).toBe(2)
    advanceTower(s, MANY_FLOORS)
    expect(s.tower!.lastBattle!.outcome).toBe('win')
    expect(towerBetweenFloors(s)).toBe(true)
    nextFloor(s, seqRng(0.3))
    expect(s.tower!.battleMsLeft).toBeGreaterThan(0)
  })

  it('con la app cerrada sube sola unos pocos pisos (hasta que toca elegir ataque) y después espera', () => {
    const s = withMon(MAX_LEVEL)
    startTower(s, firstMove(s), seqRng(0.3))
    advanceTower(s, Number.MAX_SAFE_INTEGER, seqRng(0.3))
    expect(towerBetweenFloors(s)).toBe(true)
    expect(s.tower!.floor).toBe(Math.min(2 + TOWER_AWAY_FLOORS, TOWER_MOVE_PICK_EVERY + 1))
    expect(s.tower!.awayFloors).toBeLessThanOrEqual(TOWER_AWAY_FLOORS)
  })

  it('si no da tiempo al paseo entre pisos (app delante), no sigue sola', () => {
    const s = withMon(MAX_LEVEL)
    startTower(s, firstMove(s), seqRng(0.3))
    advanceTower(s, s.tower!.battleMsLeft + TOWER_AWAY_GAP_MS - 1, seqRng(0.3))
    expect(towerBetweenFloors(s)).toBe(true)
    expect(s.tower!.floor).toBe(2)
  })

  it('al pedir piso la pantalla, vuelve a tener pisos para subir sola', () => {
    const s = withMon(MAX_LEVEL)
    startTower(s, firstMove(s), seqRng(0.3))
    advanceTower(s, s.tower!.battleMsLeft + TOWER_AWAY_GAP_MS, seqRng(0.3))
    expect(s.tower!.awayFloors).toBe(1)
    finishBattle(s)
    nextFloor(s, seqRng(0.3))
    expect(s.tower!.awayFloors).toBe(0)
  })

  it('solo sigue con su Pokémon de compañero', () => {
    const s = withMon(MAX_LEVEL)
    startTower(s, firstMove(s), seqRng(0.3))
    finishBattle(s)
    s.activeUid = null
    expect(canContinueTower(s)).toBe(false)
    nextFloor(s)
    expect(towerBetweenFloors(s)).toBe(true)
  })

  it('pide elegir ataque cada pocos pisos', () => {
    const s = withMon(MAX_LEVEL)
    startTower(s, firstMove(s), seqRng(0.3))
    climb(s, seqRng(0.3), TOWER_MOVE_PICK_EVERY - 1)
    finishBattle(s)
    expect(s.tower!.floor).toBe(TOWER_MOVE_PICK_EVERY + 1)
    expect(towerMovePickDue(s)).toBe(true)
    nextFloor(s)
    expect(towerBetweenFloors(s)).toBe(true)
    pickTowerMove(s, firstMove(s))
    expect(towerMovePickDue(s)).toBe(false)
  })

  it('sube mientras gana y, al caer, se acaba con el récord y lo ganado', () => {
    const s = withMon(1)
    const money = s.money
    startTower(s, firstMove(s), seqRng(0.3, 0.6, 0.9))
    climb(s, seqRng(0.3, 0.6, 0.9))
    const t = s.tower!
    expect(t.end).toBe(TowerEnd.Fainted)
    expect(s.towerBest).toBe(t.floor - 1)
    expect(s.money).toBe(money + t.earned.money + t.earned.prizes.reduce((sum, p) => sum + p.money, 0))
  })

  it('se cura en los pisos de cura y no pasado el último', () => {
    expect(isHealFloor(TOWER_HEAL_EVERY)).toBe(true)
    expect(isHealFloor(TOWER_HEAL_EVERY + 1)).toBe(false)
    expect(isHealFloor(TOWER_LAST_HEAL_FLOOR)).toBe(true)
    expect(isHealFloor(TOWER_LAST_HEAL_FLOOR + TOWER_HEAL_EVERY)).toBe(false)
  })

  it('tras el piso de cura, el siguiente empieza con todos los PS', () => {
    const s = withMon(MAX_LEVEL)
    startTower(s, firstMove(s), seqRng(0.5))
    s.tower!.floor = TOWER_HEAL_EVERY
    s.tower!.hp = 1
    finishBattle(s)
    s.tower!.moveFloor = s.tower!.floor
    nextFloor(s, seqRng(0.5))
    const next = s.tower!.lastBattle!
    expect(next.events[0].playerHp).toBe(next.player.maxHp)
  })

  it('abandonarla entre pisos la acaba con lo ganado; en pleno combate, no', () => {
    const s = withMon(MAX_LEVEL)
    startTower(s, firstMove(s), seqRng(0.5))
    abandonTower(s)
    expect(s.tower!.end).toBeNull()
    finishBattle(s)
    abandonTower(s)
    expect(s.tower!.end).toBe(TowerEnd.Left)
    expect(canStartTower(s)).toBe(true)
  })

  it('mientras sube, su Pokémon está en la torre y no puede ir a ninguna otra actividad', () => {
    const s = withMon(MAX_LEVEL)
    const uid = activeMon(s)!.uid
    startTower(s, firstMove(s), seqRng(0.5))
    finishBattle(s)
    expect(monPlace(s, uid)).toBe(MonPlace.Tower)
    expect(runBlocker(s)).not.toBeNull()
    expect(expeditionBlocker(s, uid)).not.toBeNull()
    abandonTower(s)
    expect(monPlace(s, uid)).toBe(MonPlace.Ranch)
  })

  it('si el compañero está en otra actividad, no puede subir', () => {
    const s = withMon(MAX_LEVEL)
    s.expeditions.push({ uid: activeMon(s)!.uid } as never)
    expect(towerBlocker(s)).not.toBeNull()
    startTower(s, firstMove(s))
    expect(s.tower).toBeNull()
  })

  it('se puede volver a elegir de compañero al que está en la torre para retomarla', () => {
    const s = withMon(MAX_LEVEL)
    const uid = activeMon(s)!.uid
    startTower(s, firstMove(s), seqRng(0.5))
    finishBattle(s)
    s.activeUid = null
    setActive(s, uid)
    expect(canContinueTower(s)).toBe(true)
  })


  it('apunta el mejor piso de la semana, que empieza de cero la semana siguiente', () => {
    const s = withMon(MAX_LEVEL)
    startTower(s, firstMove(s), seqRng(0.5))
    finishBattle(s)
    expect(towerWeekBest(s, s.lastTick)).toBe(1)
    expect(s.towerWeek.week).toBe(rankingWeek(s.lastTick))
    const nextWeek = rankingWeek(s.lastTick) + WEEK_MS
    expect(towerWeekBest(s, nextWeek)).toBe(0)
    s.lastTick = nextWeek
    nextFloor(s, seqRng(0.5))
    finishBattle(s)
    expect(s.towerWeek).toEqual({ week: nextWeek, best: 2 })
    expect(s.towerBest).toBe(2)
  })
})

/** Una semana en ms */
const WEEK_MS = 7 * 24 * 60 * 60 * 1000

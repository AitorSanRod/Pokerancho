import { describe, expect, it, vi } from 'vitest'
import { POKEMON } from '../../data/pokemon'
import type { Rng } from '../core/random'
import { activeMon, initialState, MonPlace, monPlace, type GameState } from '../core/state'
import { chooseStarter, seqRng } from '../core/test-utils'
import { MAX_LEVEL, maxHp } from '../team/stats'
import { rankingWeek } from '../core/ranking'
import { runBlocker } from '../run/run'
import { SHINY_FOE_CHANCE, SHINY_FOE_EXP_MULT, shinyIntro } from '../run/shinyFoe'
import { expeditionBlocker } from '../team/expedition'
import { setActive } from '../team/ranch'
import { createMon, NEW_MON_LEVEL } from '../team/mons'
import {
  abandonTower,
  advanceTower,
  canStartTower,
  closeTower,
  isHealFloor,
  startTower,
  TOWER_FLOOR_GAP_MS,
  TOWER_HEAL_EVERY,
  TOWER_LAST_HEAL_FLOOR,
  towerBetweenFloors,
  towerBlocker,
} from './tower'
import { towerWeekBest } from './towerWeek'
import { catchTowerEgg, TOWER_EGG_VISIBLE_MS } from './towerEgg'
import { TowerEnd } from './towerRun'
import { towerMove, towerMoveChoices } from './towerMoves'
import { floorExp, towerPrize } from './towerRewards'
import { TOWER_PRIZE_EVERY } from '../../data/towerPrizes'
import { sideMove } from '../battle/battle'

vi.mock('../../data/maps/kantoMaps', () => import('../core/test-map'))
vi.mock('../../data/rankingCuts', () => ({ RANKING_EXTRA_CUTS: [] }))

/** Tiempo de sobra para que caiga */
const FOREVER = Number.MAX_SAFE_INTEGER
/** Azar que hace shiny al rival */
const ALWAYS = () => 0
/** Azar que nunca hace shiny al rival */
const NEVER: Rng = () => SHINY_FOE_CHANCE

function withMon(level: number) {
  const s = initialState()
  chooseStarter(s, POKEMON.Charmander)
  const mon = activeMon(s)!
  mon.level = level
  mon.hp = maxHp(mon)
  return s
}

const firstMove = (s: GameState) => towerMoveChoices(activeMon(s)!)[0].id

/** Acaba el combate en curso, como si pasara el tiempo */
const finishBattle = (s: GameState) => advanceTower(s, s.tower!.battleMsLeft)

/** Acaba el combate en curso y pasea hasta empezar el siguiente piso */
const toNextFloor = (s: GameState, rng: Rng) => advanceTower(s, s.tower!.battleMsLeft + TOWER_FLOOR_GAP_MS, rng)

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

  it('al ganar un piso pasea un poco y empieza el siguiente solo', () => {
    const s = withMon(MAX_LEVEL)
    startTower(s, firstMove(s), seqRng(0.3))
    finishBattle(s)
    expect(towerBetweenFloors(s)).toBe(true)
    expect(s.tower!.floor).toBe(2)
    advanceTower(s, TOWER_FLOOR_GAP_MS - 1, seqRng(0.3))
    expect(towerBetweenFloors(s)).toBe(true)
    advanceTower(s, 1, seqRng(0.3))
    expect(s.tower!.battleMsLeft).toBeGreaterThan(0)
    expect(s.tower!.floor).toBe(2)
  })

  it('con la app cerrada sigue subiendo, sin límite de pisos, hasta que cae', () => {
    const s = withMon(MAX_LEVEL)
    startTower(s, firstMove(s), seqRng(0.3))
    advanceTower(s, FOREVER, seqRng(0.3))
    expect(s.tower!.end).toBe(TowerEnd.Fainted)
    expect(s.towerBest).toBe(s.tower!.floor - 1)
    expect(s.towerBest).toBeGreaterThan(TOWER_HEAL_EVERY)
  })

  it('sale con los PS que tiene el Pokémon y, debilitado, no puede subir', () => {
    const s = withMon(MAX_LEVEL)
    const mon = activeMon(s)!
    mon.hp = Math.floor(maxHp(mon) / 2)
    startTower(s, firstMove(s), NEVER)
    const first = s.tower!.lastBattle!
    expect(first.events[0].playerHp).toBeLessThan(first.player.maxHp)
    abandonTower(s)
    closeTower(s)
    mon.hp = 0
    expect(towerBlocker(s)).not.toBeNull()
    startTower(s, firstMove(s))
    expect(s.tower).toBeNull()
  })

  it('al caer, su Pokémon se queda sin PS, como en una ruta', () => {
    const s = withMon(1)
    startTower(s, firstMove(s), seqRng(0.3, 0.6, 0.9))
    advanceTower(s, FOREVER, seqRng(0.3, 0.6, 0.9))
    expect(s.tower!.end).toBe(TowerEnd.Fainted)
    expect(activeMon(s)!.hp).toBe(0)
  })

  it('al abandonar se queda con los PS de ese momento: entre pisos, los que le quedan; tras curarse, todos', () => {
    const s = withMon(MAX_LEVEL)
    const mon = activeMon(s)!
    startTower(s, firstMove(s), NEVER)
    finishBattle(s)
    const t = s.tower!
    t.hp = Math.floor(t.lastBattle!.player.maxHp / 2)
    abandonTower(s)
    expect(mon.hp).toBe(Math.round((t.hp * maxHp(mon)) / t.lastBattle!.player.maxHp))
    expect(mon.hp).toBeLessThan(maxHp(mon))
    closeTower(s)
    mon.hp = 1
    startTower(s, firstMove(s), NEVER)
    finishBattle(s)
    s.tower!.hp = null
    abandonTower(s)
    expect(mon.hp).toBe(maxHp(mon))
  })

  it('si abandona en pleno combate, se queda con los PS del momento que se ve', () => {
    const s = withMon(MAX_LEVEL)
    const mon = activeMon(s)!
    startTower(s, firstMove(s), NEVER)
    const b = s.tower!.lastBattle!
    abandonTower(s)
    expect(mon.hp).toBe(Math.min(maxHp(mon), Math.round((b.events[0].playerHp * maxHp(mon)) / b.player.maxHp)))
  })

  it('si su Pokémon ya no está, la subida se acaba', () => {
    const s = withMon(MAX_LEVEL)
    startTower(s, firstMove(s), seqRng(0.3))
    finishBattle(s)
    s.owned = []
    advanceTower(s, TOWER_FLOOR_GAP_MS)
    expect(s.tower!.end).toBe(TowerEnd.Fainted)
  })

  it('los rivales pueden salir shiny, como en las rutas: con su brillo, su aviso y más EXP', () => {
    const s = withMon(MAX_LEVEL)
    startTower(s, firstMove(s), ALWAYS)
    const shiny = s.tower!.lastBattle!
    expect(shiny.enemy.shiny).toBe(true)
    expect(shiny.events[0].text).toBe(shinyIntro(shiny.enemy.name, shiny.enemy.level))
    expect(s.tower!.prize!.exp).toBe(floorExp(1) * SHINY_FOE_EXP_MULT)
    abandonTower(s)
    closeTower(s)
    startTower(s, firstMove(s), NEVER)
    expect(s.tower!.lastBattle!.enemy.shiny).toBeUndefined()
    expect(s.tower!.prize!.exp).toBe(floorExp(1))
  })

  it('sube mientras gana y, al caer, se acaba con el récord y lo ganado', () => {
    const s = withMon(1)
    const money = s.money
    startTower(s, firstMove(s), seqRng(0.3, 0.6, 0.9))
    advanceTower(s, FOREVER, seqRng(0.3, 0.6, 0.9))
    const t = s.tower!
    expect(t.end).toBe(TowerEnd.Fainted)
    expect(s.towerBest).toBe(t.floor - 1)
    expect(s.money).toBe(money + t.earned.money + t.earned.prizes.reduce((sum, p) => sum + p.money, 0))
  })

  /** Sube al piso 1 con un Huevo Suerte de premio y lo gana: el huevo queda en la escena */
  function withEggOnScene() {
    const s = withMon(MAX_LEVEL)
    startTower(s, firstMove(s), NEVER)
    s.tower!.prize!.egg = true
    finishBattle(s)
    expect(s.tower!.egg).not.toBeNull()
    return s
  }

  it('el Huevo Suerte de un piso ganado sale en la escena y, si se toca, va a la Mochila', () => {
    const s = withEggOnScene()
    const eggs = s.luckyEggs
    expect(catchTowerEgg(s)).toBe(true)
    expect(s.luckyEggs).toBe(eggs + 1)
    expect(s.tower!.earned.eggs).toBe(1)
    expect(s.tower!.egg).toBeNull()
    expect(catchTowerEgg(s)).toBe(false)
  })

  it('si no se toca a tiempo (o con la app cerrada), el huevo se pierde', () => {
    const s = withEggOnScene()
    const eggs = s.luckyEggs
    advanceTower(s, TOWER_EGG_VISIBLE_MS - 1, NEVER)
    expect(s.tower!.egg).not.toBeNull()
    advanceTower(s, 1, NEVER)
    expect(s.tower!.egg).toBeNull()
    expect(catchTowerEgg(s)).toBe(false)
    expect(s.luckyEggs).toBe(eggs)
  })

  it('con la subida acabada, el huevo ya no se puede coger', () => {
    const s = withEggOnScene()
    abandonTower(s)
    expect(catchTowerEgg(s)).toBe(false)
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
    toNextFloor(s, seqRng(0.5))
    const next = s.tower!.lastBattle!
    expect(next.events[0].playerHp).toBe(next.player.maxHp)
  })

  it('se puede abandonar cuando se quiera: el piso en pleno combate no cuenta', () => {
    const s = withMon(MAX_LEVEL)
    startTower(s, firstMove(s), seqRng(0.5))
    abandonTower(s)
    expect(s.tower).toMatchObject({ end: TowerEnd.Left, floor: 1 })
    expect(s.towerBest).toBe(0)
    advanceTower(s, FOREVER)
    expect(s.tower!.floor).toBe(1)
    expect(canStartTower(s)).toBe(true)
  })

  it('la subida solo se recoge cuando ya ha acabado', () => {
    const s = withMon(MAX_LEVEL)
    startTower(s, firstMove(s), seqRng(0.5))
    finishBattle(s)
    closeTower(s)
    expect(s.tower).not.toBeNull()
    abandonTower(s)
    closeTower(s)
    expect(s.tower).toBeNull()
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

  it('con el compañero en la torre no se puede elegir otro hasta que la termine', () => {
    const s = withMon(MAX_LEVEL)
    const companion = activeMon(s)!
    const other = createMon(companion.speciesId, NEW_MON_LEVEL, companion.ranch)
    s.owned.push(other)
    startTower(s, firstMove(s), seqRng(0.5))
    finishBattle(s)
    setActive(s, other.uid)
    expect(s.activeUid).toBe(companion.uid)
    abandonTower(s)
    setActive(s, other.uid)
    expect(s.activeUid).toBe(other.uid)
  })

  it('los premios de piso vuelven cada semana, aunque el récord de siempre sea mayor', () => {
    const s = withMon(MAX_LEVEL)
    s.towerBest = TOWER_PRIZE_EVERY * 10
    const reachPrizeFloor = () => {
      startTower(s, firstMove(s), NEVER)
      s.tower!.floor = TOWER_PRIZE_EVERY - 1
      toNextFloor(s, NEVER)
      expect(s.tower!.floor).toBe(TOWER_PRIZE_EVERY)
    }
    reachPrizeFloor()
    expect(s.tower!.prize!.prize).toEqual(towerPrize(TOWER_PRIZE_EVERY))
    abandonTower(s)
    closeTower(s)
    s.towerWeek = { week: rankingWeek(s.lastTick), best: TOWER_PRIZE_EVERY }
    reachPrizeFloor()
    expect(s.tower!.prize!.prize).toBeNull()
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
    advanceTower(s, TOWER_FLOOR_GAP_MS, seqRng(0.5))
    finishBattle(s)
    expect(s.towerWeek).toEqual({ week: nextWeek, best: 2 })
    expect(s.towerBest).toBe(2)
  })
})

/** Una semana en ms */
const WEEK_MS = 7 * 24 * 60 * 60 * 1000

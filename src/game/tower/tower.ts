import { SPECIES } from '../../data/species'
import { makeFighter, simulateBattle, type BattleRecord } from '../battle/battle'
import type { Rng } from '../core/random'
import { activeMon, type GameState } from '../core/state'
import { battleDuration } from '../run/battleTimeline'
import { monPerks } from '../team/perks'
import { ranchPassives } from '../team/ranchPassives'

// Torre infinita (prueba de concepto, solo en desarrollo): el compañero sube piso a piso contra rivales al azar cada
// vez más fuertes, sin curarse salvo cada pocos pisos, hasta que cae. No da premios ni toca al Pokémon de verdad (lucha
// una copia con sus stats, pasivas e hitos): solo se guarda el piso más alto alcanzado.

/** Nivel del rival del primer piso */
export const TOWER_START_LEVEL = 5
/** Niveles que sube el rival en cada piso */
export const TOWER_LEVELS_PER_FLOOR = 1
/** Multiplicador de las stats de los rivales de la torre */
export const TOWER_STAT_MULT = 0.8
/** Cada cuántos pisos se cura del todo antes de seguir */
export const TOWER_HEAL_EVERY = 5

export interface TowerRun {
  /** Piso en el que está luchando (1 = el primero) */
  floor: number
  /** PS que le quedan a la copia del compañero (en la escala del combate); null, todos */
  hp: number | null
  lastBattle: BattleRecord | null
  /** Milisegundos reales que quedan del combate del piso */
  battleMsLeft: number
  /** Ha caído (o el rival huyó): la torre se acabó */
  over: boolean
}

export const towerLevel = (floor: number): number => TOWER_START_LEVEL + (floor - 1) * TOWER_LEVELS_PER_FLOOR

/** Sale a la torre con el compañero, desde el primer piso y con todos sus PS */
export function startTower(s: GameState, rng: Rng = Math.random) {
  if (!activeMon(s)) return
  s.tower = { floor: 1, hp: null, lastBattle: null, battleMsLeft: 0, over: false }
  fightFloor(s, rng)
}

/** Combate del piso en el que está, contra un rival al azar a su nivel */
function fightFloor(s: GameState, rng: Rng) {
  const t = s.tower!
  const mon = activeMon(s)!
  const enemyId = SPECIES[Math.floor(rng() * SPECIES.length)].id
  const level = towerLevel(t.floor)
  const player = makeFighter('player', mon.speciesId, mon.level, {
    stars: mon.stars,
    nature: mon.nature,
    passives: mon.ranch !== null ? ranchPassives(s, mon.ranch) : [],
    perks: monPerks(s, mon),
  })
  player.hp = Math.min(player.maxHp, t.hp ?? player.maxHp)
  const enemy = makeFighter('enemy', enemyId, level, { statMult: TOWER_STAT_MULT })
  const result = simulateBattle(player, enemy, rng)
  t.lastBattle = {
    player: { speciesId: mon.speciesId, name: player.name, level: mon.level, maxHp: player.maxHp },
    enemy: { speciesId: enemyId, name: enemy.name, level, maxHp: enemy.maxHp },
    events: result.events,
    outcome: result.outcome,
    boss: false,
    rewards: { money: 0, tickets: 0, exp: 0, piece: false, moneyLost: 0 },
  }
  t.hp = result.playerHp
  t.battleMsLeft = battleDuration(t.lastBattle)
}

/** Acaba el combate del piso: si ganó, sube (curándose cada TOWER_HEAL_EVERY pisos); si no, se acaba y queda el récord */
function finishFloor(s: GameState, rng: Rng) {
  const t = s.tower!
  if (t.lastBattle!.outcome !== 'win') {
    t.over = true
    s.towerBest = Math.max(s.towerBest, t.floor - 1)
    return
  }
  s.towerBest = Math.max(s.towerBest, t.floor)
  if (t.floor % TOWER_HEAL_EVERY === 0) t.hp = null
  t.floor++
  fightFloor(s, rng)
}

/** Pasa `ms` reales: los combates se ven a su velocidad, uno tras otro */
export function advanceTower(s: GameState, ms: number, rng: Rng = Math.random) {
  let left = ms
  while (s.tower && !s.tower.over && left > 0) {
    const spent = Math.min(left, s.tower.battleMsLeft)
    s.tower.battleMsLeft -= spent
    left -= spent
    if (s.tower.battleMsLeft > 0) return
    if (activeMon(s)) finishFloor(s, rng)
    else s.tower = null
  }
}

export function leaveTower(s: GameState) {
  s.tower = null
}

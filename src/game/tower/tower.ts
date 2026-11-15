import { makeFighter } from '../battle/battle'
import type { Rng } from '../core/random'
import { activeMon, MonPlace, monPlace, type GameState, type OwnedMon } from '../core/state'
import { playSetup } from '../run/battleReplay'
import { battleDuration } from '../run/battleTimeline'
import { foeExpMult, foeStatMult, rollShinyFoe, shinyIntro } from '../run/shinyFoe'
import { monPerks } from '../team/perks'
import { ranchPassives } from '../team/ranchPassives'
import { keepTowerHp } from './towerHp'
import { recordWeekFloor, towerWeekBest } from './towerWeek'
import { towerFoe, towerLevel, towerStatMult } from './towerFoes'
import { knowsTowerMove, towerMove } from './towerMoves'
import { floorPrize, noTowerEarned, rewardFloor } from './towerRewards'
import { TowerEnd } from './towerRun'

// Torre infinita: el compañero sube piso a piso contra rivales cada vez más fuertes (towerFoes.ts),
// con el ataque elegido, que se cambia cuando se quiera, también en pleno combate (towerMoveSwitch.ts), y premios en cada piso (towerRewards.ts), hasta que cae.
// Lucha una copia con sus stats, pasivas e hitos, que sale con sus PS y, al acabar, le deja los que queden (towerHp.ts).
// Sube sola, se mire o no: tras cada victoria pasea TOWER_FLOOR_GAP_MS y empieza el siguiente piso, con la app delante,
// en otra pantalla o cerrada, hasta que cae o se abandona. Los rivales pueden salir shiny, como en las rutas (run/shinyFoe.ts).

/** Cada cuántos pisos se cura del todo antes de seguir */
export const TOWER_HEAL_EVERY = 25
/** Último piso tras el que se cura; más arriba ya no hay curas */
export const TOWER_LAST_HEAL_FLOOR = 100
/** Milisegundos reales que camina entre un piso ganado y el siguiente */
export const TOWER_FLOOR_GAP_MS = 700

export const towerActive = (s: GameState): boolean => s.tower !== null && s.tower.end === null

/** Subiendo y entre dos pisos: paseando hasta el siguiente */
export const towerBetweenFloors = (s: GameState): boolean => towerActive(s) && s.tower!.battleMsLeft === 0

/** El Pokémon que sube */
export const towerMon = (s: GameState): OwnedMon | null => s.owned.find((m) => m.uid === s.tower?.uid) ?? null

/** Lo que dice cada sitio en el que puede estar el compañero para no poder subir */
const AWAY_TEXT: Partial<Record<MonPlace, string>> = {
  [MonPlace.Run]: 'Tu compañero está en una ruta: termínala para subir a la torre.',
  [MonPlace.Expedition]: 'Tu compañero está de expedición: espera a que vuelva para subir a la torre.',
  [MonPlace.Raid]: 'Tu compañero está luchando contra un jefe: espera a que acabe para subir a la torre.',
  [MonPlace.Incursion]: 'Tu compañero está en una incursión: termínala para subir a la torre.',
  [MonPlace.Box]: 'Tu compañero está en la Caja: llévalo al rancho para subir a la torre.',
}

/** Por qué no se puede empezar una subida (sin compañero, con él en otra actividad o con otra a medias), o null */
export function towerBlocker(s: GameState): string | null {
  const mon = activeMon(s)
  if (!mon) return 'Necesitas un compañero para subir a la torre.'
  if (towerActive(s)) return 'Ya hay una subida a medias.'
  if (mon.hp < 1) return 'Tu compañero está debilitado: déjalo descansar o cúralo en el rancho para subir a la torre.'
  return AWAY_TEXT[monPlace(s, mon.uid)] ?? null
}

/** Se puede empezar una subida nueva */
export const canStartTower = (s: GameState): boolean => towerBlocker(s) === null

/** Se cura al acabar este piso */
export const isHealFloor = (floor: number): boolean => floor % TOWER_HEAL_EVERY === 0 && floor <= TOWER_LAST_HEAL_FLOOR

/** Sale a la torre con el compañero y el ataque elegido, desde el primer piso y con los PS que tiene, como a una ruta */
export function startTower(s: GameState, moveId: string, rng: Rng = Math.random) {
  const mon = activeMon(s)
  if (!canStartTower(s) || !mon || !knowsTowerMove(mon, moveId)) return
  s.tower = {
    uid: mon.uid,
    moveId,
    floor: 1,
    hp: null,
    lastBattle: null,
    battle: null,
    prize: null,
    battleMsLeft: 0,
    gapMsLeft: 0,
    startBest: s.towerBest,
    earned: noTowerEarned(),
    end: null,
  }
  fightFloor(s, mon, rng, Math.floor(mon.hp))
}

/**
 * Combate del piso en el que está, contra un rival al azar a su nivel, que puede salir shiny (más fuerte y con más EXP).
 * Lucha con los PS de la subida o, en el primero, con `startHp`, los del Pokémon. Se juega con una semilla, para
 * volver a jugarlo si cambia de ataque
 */
function fightFloor(s: GameState, mon: OwnedMon, rng: Rng, startHp?: number) {
  const t = s.tower!
  const enemyId = towerFoe(s, t.floor, rng)
  const level = towerLevel(t.floor)
  const shiny = rollShinyFoe(rng)
  const player = makeFighter('player', mon.speciesId, mon.level, {
    stars: mon.stars,
    nature: mon.nature,
    passives: mon.ranch !== null ? ranchPassives(s, mon.ranch) : [],
    perks: monPerks(s, mon),
    move: towerMove(mon, t.moveId),
    hp: startHp,
  })
  if (startHp === undefined) player.hp = Math.min(player.maxHp, t.hp ?? player.maxHp)
  const enemy = makeFighter('enemy', enemyId, level, { statMult: foeStatMult(towerStatMult(t.floor), shiny) })
  t.battle = { seed: Math.floor(rng() * 2 ** 31), player, enemy, ...(shiny ? { intro: shinyIntro(enemy.name, level) } : {}) }
  const result = playSetup(t.battle)
  const base = floorPrize(t.floor, towerWeekBest(s, s.lastTick), rng)
  const prize = { ...base, exp: base.exp * foeExpMult(shiny) }
  t.prize = prize
  t.lastBattle = {
    player: { speciesId: mon.speciesId, name: player.name, level: mon.level, maxHp: player.maxHp, move: player.move },
    enemy: { speciesId: enemyId, name: enemy.name, level, maxHp: enemy.maxHp, ...(shiny ? { shiny: true } : {}) },
    events: result.events,
    outcome: result.outcome,
    boss: false,
    rewards: { money: prize.money + (prize.prize?.money ?? 0), tickets: prize.prize?.tickets ?? 0, exp: prize.exp, piece: prize.piece, moneyLost: 0 },
  }
  t.hp = result.playerHp
  t.battleMsLeft = battleDuration(t.lastBattle)
}

/** Acaba el combate del piso: si ganó, cobra y echa a andar hacia el siguiente (curado en los de cura); si no, se acaba */
function finishFloor(s: GameState) {
  const t = s.tower!
  const mon = towerMon(s)
  if (t.lastBattle!.outcome !== 'win' || !mon) {
    if (mon) keepTowerHp(t, mon)
    t.end = TowerEnd.Fainted
    return
  }
  rewardFloor(s, mon, t.earned, t.lastBattle!.enemy.speciesId, t.prize!)
  s.towerBest = Math.max(s.towerBest, t.floor)
  recordWeekFloor(s, t.floor)
  if (isHealFloor(t.floor)) t.hp = null
  t.floor++
  t.gapMsLeft = TOWER_FLOOR_GAP_MS
}

/**
 * Pasa `ms` reales, se mire o no: el combate en curso sigue a su velocidad y, al ganarlo, pasea hasta el siguiente piso
 * y lo empieza, una y otra vez, hasta que se acaba el tiempo o cae
 */
export function advanceTower(s: GameState, ms: number, rng: Rng = Math.random) {
  const t = s.tower
  let left = ms
  while (t && t.end === null && left > 0) {
    if (t.battleMsLeft === 0) {
      const walked = Math.min(left, t.gapMsLeft)
      t.gapMsLeft -= walked
      left -= walked
      if (t.gapMsLeft > 0) return
      startNextFloor(s, rng)
      continue
    }
    const spent = Math.min(left, t.battleMsLeft)
    t.battleMsLeft -= spent
    left -= spent
    if (t.battleMsLeft === 0) finishFloor(s)
  }
}

/** Tras el paseo, el combate del siguiente piso; si su Pokémon ya no está, la subida se acaba */
function startNextFloor(s: GameState, rng: Rng) {
  const mon = towerMon(s)
  if (mon) fightFloor(s, mon, rng)
  else s.tower!.end = TowerEnd.Fainted
}

/** El jugador la deja cuando quiera: se acaba ahí, con lo ganado (el piso en pleno combate no cuenta) y los PS de ese momento */
export function abandonTower(s: GameState) {
  const t = s.tower
  if (!t || t.end !== null) return
  const mon = towerMon(s)
  if (mon) keepTowerHp(t, mon)
  Object.assign(t, { end: TowerEnd.Left, battleMsLeft: 0, gapMsLeft: 0 })
}

/** Tras ver los premios de la subida acabada, se recoge (lo ganado ya estaba sumado) */
export function closeTower(s: GameState) {
  if (s.tower?.end !== null) s.tower = null
}

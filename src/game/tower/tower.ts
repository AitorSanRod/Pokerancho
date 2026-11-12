import { makeFighter, simulateBattle, type BattleRecord } from '../battle/battle'
import type { Rng } from '../core/random'
import { activeMon, MonPlace, monPlace, type GameState, type OwnedMon } from '../core/state'
import { battleDuration } from '../run/battleTimeline'
import { monPerks } from '../team/perks'
import { ranchPassives } from '../team/ranchPassives'
import { towerFoe, towerLevel, towerStatMult } from './towerFoes'
import { isMovePickFloor, towerMove, towerMoveChoices } from './towerMoves'
import { floorPrize, noTowerEarned, rewardFloor, type FloorPrize, type TowerEarned } from './towerRewards'

// Torre infinita: el compañero sube piso a piso contra rivales cada vez más fuertes (towerFoes.ts),
// con el ataque que se elige cada pocos pisos (towerMoves.ts) y premios en cada piso (towerRewards.ts), hasta que cae.
// Lucha una copia con sus stats, pasivas e hitos (sus PS de verdad no cambian). El combate en curso sigue aunque no se
// mire, pero el siguiente piso solo empieza cuando la pantalla lo pide (nextFloor): salir la deja parada entre pisos,
// tal cual, para retomarla después con el mismo Pokémon de compañero.

/** Cada cuántos pisos se cura del todo antes de seguir */
export const TOWER_HEAL_EVERY = 25
/** Último piso tras el que se cura; más arriba ya no hay curas */
export const TOWER_LAST_HEAL_FLOOR = 100

/** Cómo acabó la subida: cayó o la abandonó */
export const TowerEnd = { Fainted: 'fainted', Left: 'left' } as const
export type TowerEnd = (typeof TowerEnd)[keyof typeof TowerEnd]

export interface TowerRun {
  /** El Pokémon que sube (el compañero al empezar) */
  uid: string
  /** Ataque elegido (de su repertorio de incursión) */
  moveId: string
  /** Piso antes del que se eligió el ataque por última vez */
  moveFloor: number
  /** Piso en el que está luchando o, entre combates, el siguiente (1 = el primero) */
  floor: number
  /** PS que le quedan a la copia del Pokémon (en la escala del combate); null, todos */
  hp: number | null
  lastBattle: BattleRecord | null
  /** Lo que da ganar el combate en curso */
  prize: FloorPrize | null
  /** Milisegundos reales que quedan del combate del piso; 0 entre pisos */
  battleMsLeft: number
  /** Récord antes de esta subida: los premios de piso solo se dan por encima */
  startBest: number
  earned: TowerEarned
  /** null mientras sube */
  end: TowerEnd | null
}

export const towerActive = (s: GameState): boolean => s.tower !== null && s.tower.end === null

/** Subiendo y entre dos pisos: esperando a que la pantalla pida el siguiente */
export const towerBetweenFloors = (s: GameState): boolean => towerActive(s) && s.tower!.battleMsLeft === 0

/** El Pokémon que sube */
export const towerMon = (s: GameState): OwnedMon | null => s.owned.find((m) => m.uid === s.tower?.uid) ?? null

/** Antes del siguiente piso toca elegir ataque */
export const towerMovePickDue = (s: GameState): boolean =>
  towerBetweenFloors(s) && isMovePickFloor(s.tower!.floor) && s.tower!.moveFloor !== s.tower!.floor

/** Puede seguir: está entre pisos, su Pokémon es el compañero y no está en una ruta */
export const canContinueTower = (s: GameState): boolean => towerBetweenFloors(s) && activeMon(s)?.uid === s.tower!.uid && s.run === null

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
  return AWAY_TEXT[monPlace(s, mon.uid)] ?? null
}

/** Se puede empezar una subida nueva */
export const canStartTower = (s: GameState): boolean => towerBlocker(s) === null

/** Se cura al acabar este piso */
export const isHealFloor = (floor: number): boolean => floor % TOWER_HEAL_EVERY === 0 && floor <= TOWER_LAST_HEAL_FLOOR

const knowsMove = (mon: OwnedMon, moveId: string) => towerMoveChoices(mon).some((m) => m.id === moveId)

/** Sale a la torre con el compañero y el ataque elegido, desde el primer piso y con todos sus PS */
export function startTower(s: GameState, moveId: string, rng: Rng = Math.random) {
  const mon = activeMon(s)
  if (!canStartTower(s) || !mon || !knowsMove(mon, moveId)) return
  s.tower = {
    uid: mon.uid,
    moveId,
    moveFloor: 1,
    floor: 1,
    hp: null,
    lastBattle: null,
    prize: null,
    battleMsLeft: 0,
    startBest: s.towerBest,
    earned: noTowerEarned(),
    end: null,
  }
  fightFloor(s, mon, rng)
}

/** Elige el ataque antes del piso siguiente (cuando toca o cuando quiera, entre pisos) */
export function pickTowerMove(s: GameState, moveId: string) {
  const mon = towerMon(s)
  if (!towerBetweenFloors(s) || !mon || !knowsMove(mon, moveId)) return
  s.tower!.moveId = moveId
  s.tower!.moveFloor = s.tower!.floor
}

/** Empieza el combate del siguiente piso, si se puede y no falta elegir ataque */
export function nextFloor(s: GameState, rng: Rng = Math.random) {
  if (!canContinueTower(s) || towerMovePickDue(s)) return
  fightFloor(s, towerMon(s)!, rng)
}

/** Combate del piso en el que está, contra un rival al azar a su nivel */
function fightFloor(s: GameState, mon: OwnedMon, rng: Rng) {
  const t = s.tower!
  const enemyId = towerFoe(s, t.floor, rng)
  const level = towerLevel(t.floor)
  const player = makeFighter('player', mon.speciesId, mon.level, {
    stars: mon.stars,
    nature: mon.nature,
    passives: mon.ranch !== null ? ranchPassives(s, mon.ranch) : [],
    perks: monPerks(s, mon),
    move: towerMove(mon, t.moveId),
  })
  player.hp = Math.min(player.maxHp, t.hp ?? player.maxHp)
  const enemy = makeFighter('enemy', enemyId, level, { statMult: towerStatMult(t.floor) })
  const result = simulateBattle(player, enemy, rng)
  const prize = floorPrize(t.floor, t.startBest)
  t.prize = prize
  t.lastBattle = {
    player: { speciesId: mon.speciesId, name: player.name, level: mon.level, maxHp: player.maxHp, move: player.move },
    enemy: { speciesId: enemyId, name: enemy.name, level, maxHp: enemy.maxHp },
    events: result.events,
    outcome: result.outcome,
    boss: false,
    rewards: { money: prize.money + (prize.prize?.money ?? 0), tickets: prize.prize?.tickets ?? 0, exp: prize.exp, piece: prize.piece, moneyLost: 0 },
  }
  t.hp = result.playerHp
  t.battleMsLeft = battleDuration(t.lastBattle)
}

/** Acaba el combate del piso: si ganó, cobra y queda esperando al siguiente (curado en los de cura); si no, se acaba */
function finishFloor(s: GameState) {
  const t = s.tower!
  const mon = towerMon(s)
  if (t.lastBattle!.outcome !== 'win' || !mon) {
    t.end = TowerEnd.Fainted
    return
  }
  rewardFloor(s, mon, t.earned, t.lastBattle!.enemy.speciesId, t.prize!)
  s.towerBest = Math.max(s.towerBest, t.floor)
  if (isHealFloor(t.floor)) t.hp = null
  t.floor++
}

/** Pasa `ms` reales: el combate en curso sigue a su velocidad (se mire o no) hasta acabar */
export function advanceTower(s: GameState, ms: number) {
  const t = s.tower
  if (!t || t.end !== null || t.battleMsLeft === 0) return
  t.battleMsLeft = Math.max(0, t.battleMsLeft - ms)
  if (t.battleMsLeft === 0) finishFloor(s)
}

/** El jugador la deja entre pisos: se acaba ahí, con lo ganado */
export function abandonTower(s: GameState) {
  if (towerBetweenFloors(s)) s.tower!.end = TowerEnd.Left
}

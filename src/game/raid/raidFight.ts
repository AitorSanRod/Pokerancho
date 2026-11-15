import { foe, RoomKind, type IncursionFoe } from '../../data/incursions'
import type { RaidBoss } from '../../data/raidBosses'
import { species } from '../../data/species'
import { groupProgress, IncursionPhase, type GroupPlan, type IncursionProgress } from '../incursion/activeIncursion'
import type { FightSource } from '../incursion/incursionLeg'
import { repertoire } from '../incursion/repertoire'
import { RAID_FIGHT_MS } from './raidSchedule'

// La pelea contra el jefe de la pestaña Raids: un combate de jefe de incursión (game/incursion/) de una sola sala, con
// toda la sala contra él. Turnos por Velocidad, ataques de incursión que cada jugador cambia en plena pelea, ventana
// de toques antes de cada turno, toque crítico y revivires del grupo. Termina al caer el jefe, al caer todos sin
// revivires o al acabarse el tiempo (el jefe se escapa).

/** Revivires que comparte toda la sala para la pelea entera */
export const RAID_REVIVES = 10
/**
 * Multiplicador de los PS del jefe (además del de todos los rivales de incursión, FOE_HP_MULT): lucha contra diez y,
 * con una sala de su nivel, debe aguantar buena parte de la media hora
 */
export const RAID_BOSS_HP_MULT = 18
/** Multiplicador del Ataque del jefe (además del de todos los rivales de incursión): pega a una sala entera de su nivel */
const RAID_BOSS_ATK_MULT = 0.6
/** Furia del jefe: desde el turno `fromTurn`, cada `every` turnos su Ataque sube `atk` etapas */
const RAID_BOSS_ENRAGE = { fromTurn: 40, every: 5, atk: 1 }
/** Cada tantos turnos el golpe del jefe da a toda la sala */
const RAID_BOSS_AREA_EVERY = 3
/** Milisegundos antes del final de la pelea en que ya no empieza otro turno: lo que dura como mucho el último */
const RAID_LAST_TURN_MS = 2 * 60_000

/** Id del jefe en la pelea (el primer rival de la única sala, como lo nombra incursionLeg.ts) */
export const RAID_BOSS_ID = 'foe-0-0'

/** El jefe como rival de incursión: sus ataques de incursión de su nivel, sus stats por su `statMult` y sus mecánicas */
function bossFoe(boss: RaidBoss): IncursionFoe {
  const moveIds = repertoire(boss.speciesId, boss.level).map((mv) => mv.id)
  const mechanics = { enrage: RAID_BOSS_ENRAGE, areaEvery: RAID_BOSS_AREA_EVERY }
  const statMult = boss.statMult ?? 1
  // Su `statMult` le sube la vida, la defensa y la velocidad, pero no el golpe: ya pega más por su nivel
  const extra = { hpMult: RAID_BOSS_HP_MULT, statMult, atkMult: RAID_BOSS_ATK_MULT / statMult, statusHpMult: 1 / RAID_BOSS_HP_MULT, boss: mechanics }
  return foe(boss.speciesId, boss.level, moveIds, extra)
}

/** La pelea contra el jefe para el motor de incursiones (una sala, sin premio propio: el de raid va aparte) */
export function raidSource(boss: RaidBoss): FightSource {
  return {
    id: `raid-${boss.speciesId}-${boss.level}-${boss.statMult ?? 1}`,
    rooms: [{ kind: RoomKind.Battle, name: species(boss.speciesId).name, foes: [bossFoe(boss)], reward: { money: 0, exp: 0 } }],
    prizes: [],
    revives: RAID_REVIVES,
    timeLimitMs: RAID_FIGHT_MS - RAID_LAST_TURN_MS,
  }
}

/** Por dónde va la pelea a la hora `now` */
export const fightProgress = (fight: GroupPlan, boss: RaidBoss, now: number): IncursionProgress => groupProgress(fight, raidSource(boss), now)

export const fightFinished = (fight: GroupPlan, boss: RaidBoss, now: number): boolean => fightProgress(fight, boss, now).phase === IncursionPhase.Finished

/** Fracción de la vida del jefe que le queda al final de lo simulado (1 si nadie le ha dado) */
export function finalBossHp(p: IncursionProgress): number {
  const last = p.record.legs[0].events.findLast((e) => e.target === RAID_BOSS_ID && e.maxHp)
  return last ? last.hp! / last.maxHp! : 1
}

/** Terminada la pelea, fracción de la vida del jefe que le ha quitado la sala: el premio de cada uno va por ella (1 si cae) */
export const bossShareTaken = (p: IncursionProgress): number => 1 - finalBossHp(p)

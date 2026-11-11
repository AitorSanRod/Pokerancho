import { StatusId, type PassiveRef } from '../../data/passives'
import { effectiveness } from '../../data/types'
import { attack, CONFUSION_SELF_DAMAGE, damage, mustStruggle } from '../battle/attack'
import { makeFighter, type Fighter } from '../battle/battle'
import type { Rng } from '../core/random'
import { bossHas, bossTurn, statusTicks, takeInflicted } from './raidBossStatus'
import { BOSS_ID, type Raid, type RaidHit, type RaidMember } from './raidRoom'

/** Milisegundos de juego entre rondas: en cada una pegan todos los que están en pie y el jefe pega a uno al azar */
export const RAID_ROUND_MS = 4_000
/** Milisegundos de juego que tarda en revivir, con todos sus PS, un Pokémon debilitado en la sala */
export const RAID_REVIVE_MS = 30_000
/** Multiplicador del Ataque del jefe: pega a uno por ronda, y con su Ataque entero los debilitaría casi siempre */
const RAID_BOSS_ATK_MULT = 0.35
/** Fracción máxima de los PS máximos de un Pokémon que le puede quitar el jefe de un golpe */
export const RAID_BOSS_MAX_HIT = 0.4

/** Pasivas que lleva un participante (las de su rancho, para los del jugador) */
export type PassivesOf = (m: RaidMember) => PassiveRef[]

const silent = () => {}

const isFighting = (m: RaidMember) => !m.left && m.downMs === 0

function memberFighter(m: RaidMember, passives: PassiveRef[]): Fighter {
  const f = makeFighter('player', m.speciesId, m.level, { stars: m.stars, nature: m.nature, passives })
  f.hp = Math.round(f.maxHp * m.hpFraction)
  return f
}

const bossAsMon = (raid: Raid): Fighter => makeFighter('enemy', raid.boss.speciesId, raid.boss.level, { statMult: raid.boss.statMult })

/** PS que tendría el jefe como un Pokémon cualquiera (sobre ellos le quitan PS sus estados, no sobre la vida de la sala) */
export const bossOwnMaxHp = (raid: Raid): number => bossAsMon(raid).maxHp

/** El jefe con sus stats por su `statMult`, su ataque rebajado y la vida compartida de la sala en vez de la suya */
export function bossFighter(raid: Raid): Fighter {
  const boss = bossAsMon(raid)
  boss.stats.atk = Math.max(1, Math.round(boss.stats.atk * RAID_BOSS_ATK_MULT))
  return { ...boss, hp: raid.hp, maxHp: raid.maxHp }
}

function knockOut(m: RaidMember) {
  m.hpFraction = 0
  m.downMs = RAID_REVIVE_MS
  if (m.lives !== null) m.lives = Math.max(0, m.lives - 1)
}

/** Golpe de `atk` a `def` con la fórmula de siempre; devuelve el daño hecho */
function strike(atk: Fighter, def: Fighter, rng: Rng): { dealt: number; eff: number } {
  const before = def.hp
  const eff = mustStruggle(atk, def) ? 1 : effectiveness(atk.move.type, def.types)
  attack(atk, def, silent, rng)
  return { dealt: before - def.hp, eff }
}

/** Golpe del jefe: nunca quita más de RAID_BOSS_MAX_HIT de los PS máximos de un Pokémon */
function bossStrike(boss: Fighter, target: Fighter, rng: Rng): { dealt: number; eff: number } {
  const before = target.hp
  const hit = strike(boss, target, rng)
  const cap = Math.ceil(target.maxHp * RAID_BOSS_MAX_HIT)
  if (hit.dealt <= cap) return hit
  target.hp = Math.max(0, before - cap)
  return { ...hit, dealt: before - target.hp }
}

/** Daño al jefe que no es de un golpe (sus estados): se le cuenta a `by`, quien se lo puso */
function statusHarm(raid: Raid, boss: Fighter, by: string, amount: number, status: StatusId): RaidHit {
  const before = boss.hp
  boss.hp = Math.max(0, boss.hp - amount)
  const dealt = before - boss.hp
  const member = raid.members.find((m) => m.id === by)
  if (member) member.damage += dealt
  return { from: by, to: BOSS_ID, dealt, eff: 1, fainted: boss.hp === 0, status }
}

/** El turno del jefe: sus estados pueden dejarle quieto o hacer que se golpee; si no, pega a uno de los que están en pie */
function bossAct(raid: Raid, boss: Fighter, standing: [RaidMember, Fighter][], rng: Rng): RaidHit[] {
  const turn = bossTurn(raid, rng)
  if (turn.kind === 'skip') return []
  if (turn.kind === 'self-hit') {
    const selfHit = Math.max(1, Math.floor(damage(boss, boss, boss.move, rng).dealt * CONFUSION_SELF_DAMAGE))
    return [statusHarm(raid, boss, turn.by, selfHit, StatusId.Confusion)]
  }
  const [target, f] = standing[Math.floor(rng() * standing.length)]
  boss.status = bossHas(raid, StatusId.Burn) ? StatusId.Burn : null
  const { dealt, eff } = bossStrike(boss, f, rng)
  boss.status = null
  return [{ from: BOSS_ID, to: target.id, dealt, eff, fainted: f.hp === 0 }]
}

/** Una ronda: cada participante en pie pega al jefe y, si sigue vivo, el jefe pega a uno de ellos y le hacen daño sus estados */
export function playRound(raid: Raid, passivesOf: PassivesOf, rng: Rng): RaidHit[] {
  const hits: RaidHit[] = []
  const boss = bossFighter(raid)
  const fighters = new Map(raid.members.filter(isFighting).map((m) => [m, memberFighter(m, passivesOf(m))]))

  for (const [m, f] of fighters) {
    if (boss.hp === 0) break
    const { dealt, eff } = strike(f, boss, rng)
    takeInflicted(raid, boss, m.id)
    m.damage += dealt
    hits.push({ from: m.id, to: BOSS_ID, dealt, eff, fainted: boss.hp === 0 })
  }

  const standing = [...fighters].filter(([, f]) => f.hp > 0)
  if (boss.hp > 0 && standing.length > 0) hits.push(...bossAct(raid, boss, standing, rng))
  for (const tick of statusTicks(raid, bossOwnMaxHp(raid))) {
    if (boss.hp === 0) break
    hits.push(statusHarm(raid, boss, tick.by, tick.dealt, tick.status))
  }

  for (const [m, f] of fighters) {
    if (f.hp === 0) knockOut(m)
    else m.hpFraction = f.hp / f.maxHp
  }
  raid.hp = boss.hp
  return hits
}

/** Pasa el tiempo de una ronda para los que están en la sala: cuenta su presencia y los debilitados se recuperan */
export function elapseRound(raid: Raid) {
  raid.elapsedMs += RAID_ROUND_MS
  for (const m of raid.members) {
    if (m.left) continue
    m.presentMs += RAID_ROUND_MS
    if (m.downMs === 0) continue
    m.downMs = Math.max(0, m.downMs - RAID_ROUND_MS)
    if (m.downMs === 0) m.hpFraction = 1
  }
}

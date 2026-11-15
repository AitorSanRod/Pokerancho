import { RAID_PRIZE_TABLES, RaidPrizeKind, type RaidBoss } from '../../data/raidBosses'
import { boostedMoney } from '../battle/rewards'
import { markSeen } from '../collection/dex'
import { addPieces } from '../collection/pieces'
import type { Rng } from '../core/random'
import { findMon, type GameState } from '../core/state'
import { gainExp } from '../team/stats'
import type { RaidPrize } from './raidRoom'

/** EXP de la pelea, además de la de la tabla, por cada nivel del jefe (con todo el jefe quitado; si no, su parte) */
export const RAID_FIGHT_EXP_PER_LEVEL = 20

const FIELD: Record<RaidPrizeKind, 'money' | 'tickets' | 'pieces' | 'exp'> = {
  [RaidPrizeKind.Money]: 'money',
  [RaidPrizeKind.Tickets]: 'tickets',
  [RaidPrizeKind.BossPieces]: 'pieces',
  [RaidPrizeKind.Exp]: 'exp',
}

/**
 * Tira cada línea de la tabla de premios de la categoría del jefe por separado, con sus cantidades por el `prizeMult`
 * del jefe; la EXP es para el Pokémon `uid`
 */
export function rollPrize(boss: RaidBoss, uid: string, rng: Rng): RaidPrize {
  const prize: RaidPrize = { bossSpeciesId: boss.speciesId, uid, money: 0, tickets: 0, pieces: 0, exp: 0 }
  const mult = boss.prizeMult ?? 1
  for (const roll of RAID_PRIZE_TABLES[boss.tier]) if (rng() < roll.chance) prize[FIELD[roll.kind]] += Math.round(roll.amount * mult)
  prize.money = boostedMoney(prize.money)
  return prize
}

/**
 * El premio de la pestaña Raids de un Pokémon: el de la tabla más la EXP de la pelea, todo por `share`, la parte de la
 * vida del jefe que le quitó la sala (1 si cayó). Los tickets y las piezas, redondeados hacia abajo
 */
export function fightPrize(boss: RaidBoss, uid: string, share: number, rng: Rng): RaidPrize {
  const full = rollPrize(boss, uid, rng)
  full.exp += boss.level * RAID_FIGHT_EXP_PER_LEVEL
  const part = Math.max(0, Math.min(1, share))
  return {
    ...full,
    money: Math.round(full.money * part),
    exp: Math.round(full.exp * part),
    tickets: Math.floor(full.tickets * part),
    pieces: Math.floor(full.pieces * part),
  }
}

/**
 * Suma un premio a la partida: su EXP, al Pokémon que luchó (si ya no está, se pierde); el jefe queda visto en la
 * Pokédex para poder usar sus tickets. Devuelve los niveles que ha subido ese Pokémon
 */
export function applyPrize(s: GameState, p: RaidPrize): number {
  s.money += p.money
  s.tickets += p.tickets
  markSeen(s, p.bossSpeciesId)
  if (p.pieces > 0) addPieces(s, p.bossSpeciesId, p.pieces)
  const mon = findMon(s, p.uid)
  return mon && p.exp > 0 ? gainExp(mon, p.exp).levelsGained : 0
}

/** Entrega solo el premio pendiente que está en la posición `index` (Notificaciones); null si no hay ninguno ahí */
export function collectRaidPrize(s: GameState, index: number): RaidPrize | null {
  const prize = s.raidPrizes[index]
  if (!prize) return null
  s.raidPrizes = s.raidPrizes.filter((_, i) => i !== index)
  applyPrize(s, prize)
  return prize
}

/** Entrega los premios pendientes de los jefes de la pestaña Raids */
export function collectRaidPrizes(s: GameState): RaidPrize[] {
  const prizes = s.raidPrizes
  s.raidPrizes = []
  for (const p of prizes) applyPrize(s, p)
  return prizes
}

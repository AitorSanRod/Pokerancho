import { BOT_TRAINERS, type RaidBoss } from '../../data/raidBosses'
import { Rarity, rarityOf, SPECIES } from '../../data/species'
import { hitsAllies, incursionMove } from '../../data/incursionMoves'
import { randInt, seededRng } from '../core/random'
import type { MemberState } from '../incursion/fighter'
import { botId, botMove, freshMember } from '../incursion/party'
import { RAID_LOBBY_MS, lobbyStart } from './raidSchedule'
import { RAID_ROOM_SIZE, roomBoss, type RaidRoom } from './raidRoom'

// Los bots de una sala de la pestaña Raids: salen de la semilla de la sala (iguales en todos los móviles y en el
// servidor) y van llegando con la sala abierta, uno cada RAID_BOT_EVERY_MS, hasta llenarla al empezar la pelea. Cada
// jugador que entra ocupa el sitio de un bot: si no queda hueco, el último bot en llegar se va.

/** Milisegundos reales entre la llegada de un bot y la del siguiente: con la sala llena justo al empezar la pelea */
export const RAID_BOT_EVERY_MS = RAID_LOBBY_MS / RAID_ROOM_SIZE
/** Niveles por debajo del jefe con los que llega un bot, al azar entre ambos */
const RAID_BOT_LEVELS_BELOW_BOSS: readonly [number, number] = [2, 8]
/** Rarezas de las especies que llevan los bots */
const BOT_RARITIES: Rarity[] = [Rarity.Common, Rarity.Rare]

const botSpecies = () => SPECIES.filter((sp) => BOT_RARITIES.includes(rarityOf(sp)))

let cache: { key: string; bots: MemberState[] } | null = null

/** Veces que se vuelve a sacar la especie de un bot si su ataque daría también a la sala (como Surf o Terremoto) */
const BOT_REROLLS = 20

/** Un bot con una especie al azar cuyo ataque no dé a su propio grupo (con diez en la sala, los tumbaría a todos) */
function rollBot(i: number, boss: RaidBoss, taken: MemberState[], rng: () => number): MemberState {
  const pool = botSpecies()
  const [minBelow, maxBelow] = RAID_BOT_LEVELS_BELOW_BOSS
  const level = Math.max(1, boss.level - randInt(minBelow, maxBelow, rng))
  const moves = taken.map((b) => incursionMove(b.moveId))
  let bot = freshMember({ id: botId(i), speciesId: pool[0].id, level, stars: 0, moveId: '' })
  for (let roll = 0; roll < BOT_REROLLS; roll++) {
    const speciesId = pool[randInt(0, pool.length - 1, rng)].id
    bot = { ...bot, speciesId, moveId: botMove(speciesId, level, moves) }
    if (!hitsAllies(incursionMove(bot.moveId))) break
  }
  return bot
}

/**
 * Los bots que puede llegar a tener la sala, en orden de llegada: cada uno con su ataque según lo que lleven los de
 * antes (curar o provocar si nadie lo hace, ver incursion/party.ts)
 */
export function roomBots(boss: RaidBoss, seed: number): MemberState[] {
  const key = `${boss.speciesId}:${boss.level}:${seed}`
  if (cache?.key === key) return cache.bots
  const rng = seededRng(seed)
  const bots: MemberState[] = []
  for (let i = 0; i < RAID_ROOM_SIZE; i++) bots.push(rollBot(i, boss, bots, rng))
  cache = { key, bots }
  return bots
}

/** Bots que han llegado ya a la sala abierta del ciclo a la hora `now`: el primero al abrir y uno más cada RAID_BOT_EVERY_MS */
export const botsArrived = (cycle: number, now: number): number =>
  Math.max(0, Math.min(RAID_ROOM_SIZE, Math.floor((now - lobbyStart(cycle)) / RAID_BOT_EVERY_MS) + 1))

/** Los bots que se ven en la sala abierta: los que han llegado, sin pasar de los huecos que dejan los jugadores */
export function shownBots(room: RaidRoom, now: number): MemberState[] {
  const free = Math.max(0, RAID_ROOM_SIZE - room.entrants.length)
  return roomBots(roomBoss(room), room.seed).slice(0, Math.min(botsArrived(room.cycle, now), free))
}

/** Nombre del entrenador de un bot de la sala */
export const botTrainer = (room: RaidRoom, index: number): string => BOT_TRAINERS[(room.seed + index) % BOT_TRAINERS.length]

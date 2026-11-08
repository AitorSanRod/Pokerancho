import { route } from '../../../data/maps'
import { species } from '../../../data/species'
import { PushTopic, type PushJob } from '../../core/push'
import { earnsPrize } from '../raidPrizes'
import { outOfLives } from '../raidRoom'
import { cycleBoss, type RaidCycle } from './raidCycle'
import { RoomSlot } from './protocol'
import type { SharedRoom } from './sharedRoom'

// Avisos push de los jefes comunitarios (tema Raid): los decide el servidor al ver qué ha pasado en las salas.

/** Un aviso y a quién va: los jugadores (id de raids) de una sala o todos */
export interface RaidPush {
  to: { playerIds: string[] } | 'all'
  job: PushJob
}

/** Jugadores de la sala que cuentan para el aviso: los que siguen dentro y, si `withPrize`, los que ya han cobrado */
function playersOf(room: SharedRoom, withPrize: boolean): string[] {
  const ids = Object.values(room.seats).filter((seat) => {
    const m = room.raid.members.find((x) => x.id === seat.memberId)
    return m && (!m.left || (withPrize && earnsPrize(m, room.raid.elapsedMs)))
  })
  return [...new Set(ids.map((seat) => seat.playerId))]
}

const bossName = (room: SharedRoom) => species(room.raid.boss.speciesId).name

const placeName = (room: SharedRoom) => (room.raid.place ? route(room.raid.place.routeId).name : 'la ruta')

/** Ha caído el jefe de la sala: se avisa a los que cobran (en una parada, a los que siguen en la pelea) */
function fallPush(room: SharedRoom, now: number): RaidPush | null {
  const tab = room.channel.slot === RoomSlot.Tab
  const playerIds = playersOf(room, tab)
  if (playerIds.length === 0) return null
  const name = bossName(room)
  const job: PushJob = tab
    ? { topic: PushTopic.Raid, key: `fall:${room.id}`, dueAt: now, title: '¡Jefe derrotado!', body: `Habéis tumbado a ${name}. Abre la app para recoger tu premio.` }
    : {
        topic: PushTopic.Raid,
        key: `fall:${room.id}`,
        dueAt: now,
        title: `¡${name} ha caído!`,
        body: `Tu Pokémon y su grupo lo han derrotado en ${placeName(room)}.`,
      }
  return { to: { playerIds }, job }
}

/** Ids de los participantes de la sala que han gastado sus vidas */
const spentIds = (room: SharedRoom): Set<string> => new Set(room.raid.members.filter(outOfLives).map((m) => m.id))

/** Un Pokémon del jugador ha gastado sus vidas y ha salido de la sala: en la pestaña vuelve al rancho; en una parada, la ruta empieza de nuevo */
function spentPush(room: SharedRoom, playerId: string, memberId: string, now: number): RaidPush {
  const m = room.raid.members.find((x) => x.id === memberId)!
  const body =
    room.channel.slot === RoomSlot.Tab
      ? `Ha gastado sus vidas contra ${bossName(room)} y ha vuelto al rancho.`
      : `Ha gastado sus vidas contra ${bossName(room)} en ${placeName(room)}: la ruta empieza de nuevo.`
  return {
    to: { playerIds: [playerId] },
    job: { topic: PushTopic.Raid, key: `spent:${room.id}:${memberId}`, dueAt: now, title: `${species(m.speciesId).name} se ha debilitado`, body },
  }
}

/** Lo que se apunta de una sala antes de ponerla al día, para saber después qué ha pasado (ver roomPushes) */
export interface RoomMark {
  standing: boolean
  spent: Set<string>
}

export const markRoom = (room: SharedRoom): RoomMark => ({ standing: room.raid.hp > 0, spent: spentIds(room) })

/** Avisos de lo que ha pasado en la sala desde `mark`: los Pokémon que han gastado sus vidas y la caída del jefe */
export function roomPushes(room: SharedRoom, mark: RoomMark, now: number): RaidPush[] {
  const spentNow = spentIds(room)
  const spent = Object.values(room.seats).filter((seat) => spentNow.has(seat.memberId) && !mark.spent.has(seat.memberId))
  const pushes = spent.map((seat) => spentPush(room, seat.playerId, seat.memberId, now))
  const fell = mark.standing && room.raid.hp === 0 ? fallPush(room, now) : null
  return fell ? [...pushes, fell] : pushes
}

/** El jefe se ha escapado de la sala (el ciclo pasó al siguiente sin que cayera) */
export function escapePush(room: SharedRoom, now: number): RaidPush | null {
  const playerIds = playersOf(room, false)
  if (playerIds.length === 0) return null
  return {
    to: { playerIds },
    job: { topic: PushTopic.Raid, key: `escape:${room.id}`, dueAt: now, title: `${bossName(room)} se ha escapado`, body: 'El jefe de Raids cambió antes de que cayera. Tu Pokémon ha vuelto al rancho.' },
  }
}

/** Ha aparecido el jefe de un ciclo nuevo de una rotación: se avisa a todos */
export function newBossPush(cycle: RaidCycle, now: number): RaidPush {
  const boss = cycleBoss(cycle)
  const key = `boss:${cycle.rotation}:${cycle.number}`
  const body = `${species(boss.speciesId).name} (Nv. ${boss.level}) acaba de aparecer. ¡Manda a tu Pokémon a por él!`
  return { to: 'all', job: { topic: PushTopic.Raid, key, dueAt: now, title: '¡Nueva raid!', body } }
}

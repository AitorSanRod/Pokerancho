import { incursion } from '../../../data/incursions'
import { PushTopic, type PushJob } from '../../core/push'
import type { ScheduledIncursion } from './scheduledIncursion'
import { PARTY_SIZE } from '../party'
import { checkInOpensAt } from './scheduleRules'

// Avisos push de las incursiones programadas (tema Incursion): los programa el servidor al crearlas, aceptarlas o
// cancelarlas. El servidor no sabe la zona horaria de nadie: los textos dicen cuánto falta, no la hora.

/** Adónde lleva el aviso al tocarlo (ver ui/shared/navigation.ts) */
export const PushGo = { Board: 'incursions/board', Mine: 'incursions/mine' } as const
export type PushGo = (typeof PushGo)[keyof typeof PushGo]

const NEW_KEY = 'incursion-new'
const OPEN_KEY = 'incursion-open'
const CANCEL_KEY = 'incursion-cancel'

/** Un aviso y a quién va: todos los suscritos (salvo `except`) o unos jugadores */
export interface SchedulePush {
  to: { playerIds: string[] } | 'all'
  except: string | null
  job: PushJob
}

const MINUTE_MS = 60_000

/** «2 días», «3 h 15 min», «40 min» */
function timeLeft(ms: number): string {
  const min = Math.max(1, Math.round(ms / MINUTE_MS))
  const days = Math.floor(min / (24 * 60))
  if (days >= 1) return days === 1 ? '1 día' : `${days} días`
  const [h, m] = [Math.floor(min / 60), min % 60]
  if (h === 0) return `${m} min`
  return m === 0 ? `${h} h` : `${h} h ${m} min`
}

const nameOf = (sched: ScheduledIncursion) => incursion(sched.incursionId).name
export const openPushKey = (sched: ScheduledIncursion) => `${OPEN_KEY}:${sched.id}`

/** Al programarla: a todos menos al creador */
export function newSchedulePush(sched: ScheduledIncursion, now: number): SchedulePush {
  const free = PARTY_SIZE - sched.seats.length
  const creator = sched.seats[0]?.nickname ?? 'Alguien'
  return {
    to: 'all',
    except: sched.creatorId,
    job: {
      topic: PushTopic.Incursion,
      key: `${NEW_KEY}:${sched.id}`,
      dueAt: now,
      title: `Nueva incursión: ${nameOf(sched)}`,
      body: `${creator} la ha programado; empieza dentro de ${timeLeft(sched.startAt - now)}. Quedan ${free} huecos.`,
    },
  }
}

/** Al apuntarse (o crearla): cuando abra la sala, para que venga a hacer el checkin */
export function roomOpenPush(sched: ScheduledIncursion, playerId: string): SchedulePush {
  return {
    to: { playerIds: [playerId] },
    except: null,
    job: {
      topic: PushTopic.Incursion,
      key: openPushKey(sched),
      dueAt: checkInOpensAt(sched.startAt),
      title: 'Ya puedes entrar a la sala',
      body: `${nameOf(sched)} empieza en ${timeLeft(sched.startAt - checkInOpensAt(sched.startAt))}. Haz el checkin para recuperar tu fianza.`,
    },
  }
}

/** Al cancelarla el creador: a los demás apuntados */
export function cancelPush(sched: ScheduledIncursion, now: number): SchedulePush {
  return {
    to: { playerIds: sched.seats.map((s) => s.playerId) },
    except: sched.creatorId,
    job: {
      topic: PushTopic.Incursion,
      key: `${CANCEL_KEY}:${sched.id}`,
      dueAt: now,
      title: 'Incursión cancelada',
      body: `${nameOf(sched)} se ha cancelado: recuperas tu fianza.`,
    },
  }
}

/** Adónde lleva un aviso de este tema y clave; null si a ningún sitio en concreto */
export function pushGoOf(topic: PushTopic, key: string): PushGo | null {
  if (topic !== PushTopic.Incursion) return null
  return key.startsWith(NEW_KEY) ? PushGo.Board : PushGo.Mine
}

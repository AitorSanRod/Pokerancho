import type { GiftContents } from '../../data/dailyGifts'
import { MissionKind } from '../../data/dailyMissions'
import type { GameState } from '../core/state'
import { applyGift } from './dailyGift'

// Misiones diarias: cada día (del reloj del móvil) salen unas cuantas de data/dailyMissions.ts (missionPicks.ts). Lo
// que hace el jugador las va avanzando (advanceMission) y cada una, al cumplirse, se cobra por separado.

export interface Mission {
  kind: MissionKind
  goal: number
  progress: number
  claimed: boolean
  reward: GiftContents
  /** CompleteRoute: la ruta que pide; si no, null */
  routeId: string | null
  /** CompleteRouteWith: la especie que tiene que ir de compañero; si no, null */
  speciesId: number | null
}

export interface DailyMissions {
  /** Día al que pertenecen (dayKey) */
  day: string
  list: Mission[]
}

/** Día del reloj del móvil, como «2026-11-12»: las misiones se renuevan al cambiar */
export function dayKey(now: number): string {
  const d = new Date(now)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Lo que concreta un avance: la ruta completada o el compañero que la completó */
export interface MissionContext {
  routeId?: string
  speciesId?: number
}

const matches = (m: Mission, ctx: MissionContext): boolean =>
  (m.routeId === null || m.routeId === ctx.routeId) && (m.speciesId === null || m.speciesId === ctx.speciesId)

/** Suma `amount` a las misiones de hoy de esa clase que encajen (sin pasar del objetivo) */
export function advanceMission(s: GameState, kind: MissionKind, amount = 1, ctx: MissionContext = {}) {
  for (const m of s.missions?.list ?? []) {
    if (m.kind === kind && !m.claimed && matches(m, ctx)) m.progress = Math.min(m.goal, m.progress + amount)
  }
}

export const missionDone = (m: Mission): boolean => m.progress >= m.goal

/** Misiones cumplidas y sin cobrar */
export const claimableMissions = (s: GameState): number => (s.missions?.list ?? []).filter((m) => missionDone(m) && !m.claimed).length

/** Cobra la misión `index` de hoy si está cumplida; devuelve su premio o null */
export function claimMission(s: GameState, index: number): GiftContents | null {
  const m = s.missions?.list[index]
  if (!m || m.claimed || !missionDone(m)) return null
  m.claimed = true
  applyGift(s, m.reward)
  return m.reward
}

const KINDS = Object.values(MissionKind) as unknown[]
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const isCount = (v: unknown): v is number => Number.isInteger(v) && (v as number) >= 0

function salvageMission(v: unknown): Mission | null {
  if (!isRecord(v) || !KINDS.includes(v.kind) || !isCount(v.goal) || !isCount(v.progress) || !isRecord(v.reward)) return null
  const r = v.reward
  if (![r.money, r.missingnoShards, r.tickets].every(isCount) || !isRecord(r.starItems)) return null
  return {
    kind: v.kind as MissionKind,
    goal: v.goal,
    progress: Math.min(v.goal, v.progress),
    claimed: v.claimed === true,
    reward: { money: r.money as number, missingnoShards: r.missingnoShards as number, tickets: r.tickets as number, starItems: r.starItems },
    routeId: typeof v.routeId === 'string' ? v.routeId : null,
    speciesId: Number.isInteger(v.speciesId) ? (v.speciesId as number) : null,
  }
}

/** Las misiones guardadas con la forma de ahora; si algo no encaja, ninguna (se sacan otras, ver missionPicks.ts) */
export function salvageMissions(v: unknown): DailyMissions | null {
  if (!isRecord(v) || typeof v.day !== 'string' || !Array.isArray(v.list)) return null
  const list = v.list.map(salvageMission)
  return list.every((m) => m !== null) ? { day: v.day, list: list as Mission[] } : null
}

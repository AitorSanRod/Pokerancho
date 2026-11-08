import type { StatusId } from '../../data/passives'
import type { PokeType } from '../../data/types'
import type { GroupPassive } from './groupPassives'
import type { GroupFighter, Team } from './fighter'

// Lo que pasa en una incursión, en orden, para reproducirlo en pantalla. Cada evento que cambia los PS de alguien
// lleva cómo le quedan (`hp`, `maxHp`): la pantalla no tiene que recalcular nada.

export const EventKind = {
  /** Empieza una sala: `room` y, si es de combate, los combatientes */
  Room: 'room',
  Move: 'move',
  Hit: 'hit',
  Miss: 'miss',
  Faint: 'faint',
  Status: 'status',
  Heal: 'heal',
  /** Le sube o baja una stat */
  Change: 'change',
  Taunt: 'taunt',
  Revive: 'revive',
  /** Cayó sin revivires: se queda mirando */
  Out: 'out',
  /** El jefe se enfurece */
  Rage: 'rage',
  /** Cambian las pasivas del grupo */
  Passives: 'passives',
  /** Sala superada: `reward` es lo que gana cada uno */
  Cleared: 'cleared',
} as const
export type EventKind = (typeof EventKind)[keyof typeof EventKind]

export interface FighterView {
  id: string
  team: Team
  speciesId: number
  name: string
  level: number
  hp: number
  maxHp: number
  out: boolean
  /** Rival con mecánicas de jefe */
  boss: boolean
}

export interface IncursionEvent {
  kind: EventKind
  text: string
  actor?: string
  target?: string
  hp?: number
  maxHp?: number
  /** Hit y Heal: PS que quita o devuelve */
  amount?: number
  crit?: boolean
  /** Multiplicador de eficacia de tipos del golpe */
  eff?: number
  /** Hit de un movimiento: su tipo (el efecto del golpe en pantalla) */
  type?: PokeType
  status?: StatusId
  room?: number
  fighters?: FighterView[]
  passives?: GroupPassive[]
  reward?: { money: number; exp: number }
  /** Revive: revivires que le quedan al grupo, si ha gastado uno (en una sala de revivir no se gasta) */
  revives?: number
}

export type Log = (e: IncursionEvent) => void

export const view = (f: GroupFighter): FighterView => ({
  id: f.id, team: f.team, speciesId: f.speciesId, name: f.name, level: f.level, hp: f.hp, maxHp: f.maxHp, out: f.out, boss: f.boss !== null,
})

/** Evento sobre un combatiente, con sus PS tras él */
export const on = (f: GroupFighter, e: Omit<IncursionEvent, 'target' | 'hp' | 'maxHp'>): IncursionEvent => ({
  ...e,
  target: f.id,
  hp: f.hp,
  maxHp: f.maxHp,
})

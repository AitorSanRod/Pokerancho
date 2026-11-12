import type { BossMechanics, IncursionFoe } from '../../data/incursions'
import { incursionMove, type IncursionMove } from '../../data/incursionMoves'
import type { Nature } from '../../data/natures'
import { STATUS_INFO, type StatusId } from '../../data/passives'
import { species } from '../../data/species'
import type { BoostStat } from '../../data/incursionMoves'
import type { PokeType } from '../../data/types'
import type { DamageSide } from '../battle/attack'
import { combineBonus, sumEffects, type CombatBonus } from '../battle/combatBonus'
import { noPerks, type MonPerks } from '../team/perks'
import { calcStats, type Stats } from '../team/stats'
import { noStages, stageMult, type Stages } from './statStages'

// Un combatiente de una incursión: del grupo (cinco, de sala en sala) o rival de una sala.

export const Team = { Party: 'party', Foe: 'foe' } as const
export type Team = (typeof Team)[keyof typeof Team]

/** Multiplicador de los PS de todos los rivales de incursión: luchan contra cinco (los jefes llevan además su `hpMult`) */
export const FOE_HP_MULT = 8
/** Multiplicador del Ataque de los rivales de incursión: son varios a la vez y no deben tumbar al grupo de dos golpes */
export const FOE_ATK_MULT = 0.85
/** Las pasivas de los rivales de incursión cuentan enteras (1 = al 100 %): el recorte de RANCH_PASSIVE_SCALE no llega aquí */
const INCURSION_FOE_PASSIVE_SCALE = 1

/** Lo menos que puede quedar una stat con las pasivas a la baja (0.25 = un 25% de la suya); las etapas, aparte */
export const MIN_STAT_MULT = 0.25

/** Un estado alterado puesto, con lo que le queda */
export interface Affliction {
  status: StatusId
  /** Turnos que le quedan (ver groupStatus.ts › STATUS_MAX_TURNS) */
  turns: number
  /** Turnos que lleva ya sin moverse por el sueño o la congelación (groupStatus.ts › HOLDS) */
  heldTurns: number
}

export interface GroupFighter {
  id: string
  team: Team
  speciesId: number
  name: string
  level: number
  types: PokeType[]
  /** Stats sin pasivas ni cambios (con las ★ y, en los rivales, `hpMult`) */
  base: Stats
  hp: number
  maxHp: number
  /** El ataque que usa este turno */
  move: IncursionMove
  /** Los que lleva: el del grupo, uno; un rival, los suyos, entre los que elige cada turno */
  moves: IncursionMove[]
  /** Pasivas: las del grupo (se recalculan cada turno) o las escritas en el rival */
  bonus: CombatBonus
  /** Hitos y colección de los del grupo (las stats ya van en `base`); los rivales, ninguno */
  perks: MonPerks
  /** Estados alterados que lleva, del más antiguo al más nuevo: uno como mucho, salvo los jefes (groupStatus.ts) */
  statuses: Affliction[]
  /** Etapas que lleva subidas o bajadas cada stat (statStages.ts); se pierden al acabar la sala o al caer */
  stages: Stages
  taunt: { turns: number; guard: number } | null
  /** Del grupo: a quién dirige su movimiento, elegido por el jugador (ver movePicks.ts); null, el que toque */
  target: string | null
  /** Del grupo: cayó sin revivires que gastar. Sigue en la incursión, pero no actúa ni suma pasivas */
  out: boolean
  /** Orden en que cayó (los revivires se gastan en ese orden); null si está en pie */
  fellAt: number | null
  boss: BossMechanics | null
}

/** Cómo entra un Pokémon del grupo en un tramo */
export interface MemberState {
  id: string
  speciesId: number
  level: number
  stars: number
  /** Sin ella (bots y clientes de antes de las naturalezas), neutra */
  nature?: Nature
  /** Hitos y colección (team/perks.ts); sin ellos (bots y clientes de antes), ninguno */
  perks?: MonPerks
  moveId: string
  /** PS como fracción de los máximos */
  hpFraction: number
  status: StatusId | null
  /** Turnos que lleva ya dormido o congelado; sin él (partidas de antes), 0 */
  heldTurns?: number
  out: boolean
}

function fighter(id: string, team: Team, speciesId: number, level: number, base: Stats, moveIds: string[]): GroupFighter {
  const sp = species(speciesId)
  const moves = moveIds.map(incursionMove)
  return {
    id, team, speciesId, name: sp.name, level, types: sp.types, base, hp: base.hp, maxHp: base.hp,
    move: moves[0], moves, bonus: sumEffects([]), perks: noPerks(), statuses: [], stages: noStages(), taunt: null,
    out: false, fellAt: null, boss: null, target: null,
  }
}

/** Stats con el bono de sus hitos */
function withPerks(base: Stats, perks: MonPerks): Stats {
  const out = { ...base }
  for (const k of Object.keys(out) as (keyof Stats)[]) out[k] = Math.max(1, Math.round(out[k] * (1 + perks.stats)))
  return out
}

/** Un Pokémon del grupo, con su nivel */
export function partyFighter(m: MemberState): GroupFighter {
  const perks = m.perks ?? noPerks()
  const f = { ...fighter(m.id, Team.Party, m.speciesId, m.level, withPerks(calcStats(m.speciesId, m.level, m.stars, m.nature), perks), [m.moveId]), perks }
  f.hp = m.out ? 0 : Math.round(m.hpFraction * f.maxHp)
  // El estado que trae del tramo anterior se le pasa al acabar el primer turno
  const statuses = m.status ? [{ status: m.status, turns: 1, heldTurns: m.heldTurns ?? 0 }] : []
  return { ...f, statuses, out: m.out }
}

/** Un rival de una sala, con su nivel */
export function foeFighter(foe: IncursionFoe, id: string): GroupFighter {
  const base = calcStats(foe.speciesId, foe.level)
  base.hp = Math.round(base.hp * FOE_HP_MULT * (foe.hpMult ?? 1))
  base.atk = Math.round(base.atk * FOE_ATK_MULT)
  const f = fighter(id, Team.Foe, foe.speciesId, foe.level, base, foe.moveIds)
  return { ...f, bonus: combineBonus(foe.passives ?? [], INCURSION_FOE_PASSIVE_SCALE), boss: foe.boss ?? null }
}

/** Lo que sale del tramo para el siguiente */
export const memberState = (f: GroupFighter, m: MemberState): MemberState => ({
  ...m,
  moveId: f.move.id,
  hpFraction: f.maxHp ? f.hp / f.maxHp : 0,
  status: f.statuses[0]?.status ?? null,
  heldTurns: f.statuses[0]?.heldTurns ?? 0,
  out: f.out,
})

export const isUp = (f: GroupFighter): boolean => f.hp > 0 && !f.out

/** Stat con sus pasivas y sus etapas */
export function stat(f: GroupFighter, k: BoostStat): number {
  return Math.max(1, Math.round(f.base[k] * Math.max(MIN_STAT_MULT, 1 + f.bonus[k]) * stageMult(f.stages[k])))
}

const atkMult = (s: StatusId) => STATUS_INFO[s].atkMult ?? 1

/** De sus estados, el que más le baja el Ataque (la fórmula de daño solo mira uno) */
const attackStatus = (f: GroupFighter): StatusId | null =>
  f.statuses.map((a) => a.status).reduce<StatusId | null>((worst, s) => (!worst || atkMult(s) < atkMult(worst) ? s : worst), null)

/** El combatiente tal y como lo ve la fórmula de daño de siempre */
export const damageSide = (f: GroupFighter): DamageSide => ({
  level: f.level,
  types: f.types,
  status: attackStatus(f),
  bonus: f.bonus,
  perks: f.perks,
  stats: { hp: f.maxHp, atk: stat(f, 'atk'), def: stat(f, 'def'), spe: stat(f, 'spe') },
})

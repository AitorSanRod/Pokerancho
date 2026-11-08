import type { BossMechanics, IncursionFoe } from '../../data/incursions'
import { battleMove, type BattleMove } from '../../data/learnsets'
import type { StatusId } from '../../data/passives'
import { species } from '../../data/species'
import type { BoostStat, StatChange } from '../../data/supportMoves'
import type { PokeType } from '../../data/types'
import type { DamageSide } from '../battle/attack'
import { combineBonus, sumEffects, type CombatBonus } from '../battle/combatBonus'
import { calcStats, type Stats } from '../team/stats'

// Un combatiente de una incursión: del grupo (cinco, de sala en sala) o rival de una sala.

export const Team = { Party: 'party', Foe: 'foe' } as const
export type Team = (typeof Team)[keyof typeof Team]

/** Multiplicador de los PS de todos los rivales de incursión: luchan contra cinco (los jefes llevan además su `hpMult`) */
export const FOE_HP_MULT = 8
/** Multiplicador del Ataque de los rivales de incursión: son varios a la vez y no deben tumbar al grupo de dos golpes */
export const FOE_ATK_MULT = 0.5

/** Lo menos que puede quedar una stat con los cambios a la baja (0.25 = un 25% de la suya) */
export const MIN_STAT_MULT = 0.25

/** Un cambio de stat que dura unos turnos; el mismo movimiento lo renueva en vez de sumarlo otra vez */
export interface ActiveChange extends StatChange {
  moveId: string
  turns: number
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
  move: BattleMove
  /** Pasivas: las del grupo (se recalculan cada turno) o las escritas en el rival */
  bonus: CombatBonus
  status: StatusId | null
  /** Turnos que le quedan sin moverse por la congelación */
  frozenTurns: number
  changes: ActiveChange[]
  taunt: { turns: number; guard: number } | null
  /** Del grupo: cayó sin revivires que gastar. Sigue en la incursión, pero no actúa ni suma pasivas */
  out: boolean
  /** Orden en que cayó (los revivires se gastan en ese orden); null si está en pie */
  fellAt: number | null
  boss: BossMechanics | null
  /** Veces que le ha subido el Ataque la furia */
  rage: number
}

/** Cómo entra un Pokémon del grupo en un tramo */
export interface MemberState {
  id: string
  speciesId: number
  /** Su nivel de verdad; lucha al sincronizado */
  level: number
  stars: number
  moveId: string
  /** PS como fracción de los máximos */
  hpFraction: number
  status: StatusId | null
  frozenTurns: number
  out: boolean
}

function fighter(id: string, team: Team, speciesId: number, level: number, base: Stats, moveId: string): GroupFighter {
  const sp = species(speciesId)
  return {
    id, team, speciesId, name: sp.name, level, types: sp.types, base, hp: base.hp, maxHp: base.hp,
    move: battleMove(moveId), bonus: sumEffects([]), status: null, frozenTurns: 0, changes: [], taunt: null,
    out: false, fellAt: null, boss: null, rage: 0,
  }
}

/** Un Pokémon del grupo luchando al nivel `level` (el sincronizado, ver levelSync.ts) */
export function partyFighter(m: MemberState, level: number): GroupFighter {
  const f = fighter(m.id, Team.Party, m.speciesId, level, calcStats(m.speciesId, level, m.stars), m.moveId)
  f.hp = m.out ? 0 : Math.round(m.hpFraction * f.maxHp)
  return { ...f, status: m.status, frozenTurns: m.frozenTurns, out: m.out }
}

/** Un rival de una sala a su nivel ya calculado (ver levelSync.ts › foeLevel) */
export function foeFighter(foe: IncursionFoe, id: string, level: number): GroupFighter {
  const base = calcStats(foe.speciesId, level)
  base.hp = Math.round(base.hp * FOE_HP_MULT * (foe.hpMult ?? 1))
  base.atk = Math.round(base.atk * FOE_ATK_MULT)
  const f = fighter(id, Team.Foe, foe.speciesId, level, base, foe.moveId)
  return { ...f, bonus: combineBonus(foe.passives ?? []), boss: foe.boss ?? null }
}

/** Lo que sale del tramo para el siguiente */
export const memberState = (f: GroupFighter, m: MemberState): MemberState => ({
  ...m,
  hpFraction: f.maxHp ? f.hp / f.maxHp : 0,
  status: f.status,
  frozenTurns: f.frozenTurns,
  out: f.out,
})

export const isUp = (f: GroupFighter): boolean => f.hp > 0 && !f.out

/** Stat con sus pasivas, sus cambios activos y, el Ataque de un jefe, su furia */
export function stat(f: GroupFighter, k: BoostStat): number {
  const changes = f.changes.filter((c) => c.stat === k).reduce((sum, c) => sum + c.amount, 0)
  const rage = k === 'atk' && f.boss?.enrage ? f.rage * f.boss.enrage.atk : 0
  return Math.max(1, Math.round(f.base[k] * Math.max(MIN_STAT_MULT, 1 + f.bonus[k] + changes + rage)))
}

/** El combatiente tal y como lo ve la fórmula de daño de siempre */
export const damageSide = (f: GroupFighter): DamageSide => ({
  level: f.level,
  types: f.types,
  status: f.status,
  bonus: f.bonus,
  stats: { hp: f.maxHp, atk: stat(f, 'atk'), def: stat(f, 'def'), spe: stat(f, 'spe') },
})

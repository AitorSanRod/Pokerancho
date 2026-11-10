import type { BattleMove } from '../../data/learnsets'
import { STATUS_INFO } from '../../data/passives'
import { MoveKind, type BoostStat, type StatChange } from '../../data/supportMoves'

// Cómo se cuenta en pantalla lo que hace cada movimiento de incursión.

/** Papel que da cada efecto en el grupo */
export const KIND_LABEL: Record<MoveKind, string> = {
  [MoveKind.Damage]: 'Daño',
  [MoveKind.Heal]: 'Curar',
  [MoveKind.Taunt]: 'Provocar',
  [MoveKind.Boost]: 'Apoyo',
  [MoveKind.Debuff]: 'Debilitar',
  [MoveKind.Inflict]: 'Estado',
}

const STAT_NAME: Record<BoostStat, string> = { atk: 'Ataque', def: 'Defensa', spe: 'Velocidad' }

const pct = (n: number) => `${Math.round(Math.abs(n) * 100)}%`
const stats = (changes: StatChange[]) => changes.map((c) => `${STAT_NAME[c.stat]} ${pct(c.amount)}`).join(' y ')
const accuracy = (mv: BattleMove) => (mv.accuracy < 100 ? ` · Prec. ${mv.accuracy}%` : '')

export function moveText(mv: BattleMove): string {
  switch (mv.kind) {
    case MoveKind.Damage:
      return `Golpea al rival más débil a su tipo · Pot. ${mv.power}${accuracy(mv)}`
    case MoveKind.Heal:
      return `Cura un ${pct(mv.heal)} de los PS ${mv.area ? 'a todo el grupo' : 'al aliado con menos PS'}`
    case MoveKind.Taunt:
      return `Atrae los golpes ${mv.turns} turnos y recibe un ${pct(mv.guard)} menos`
    case MoveKind.Boost:
      return `Sube ${stats(mv.changes)} a todo el grupo, ${mv.turns} turnos`
    case MoveKind.Debuff:
      return `Baja ${stats(mv.changes)} ${mv.area ? 'a todos los rivales' : 'al rival con más PS'}, ${mv.turns} turnos${accuracy(mv)}`
    case MoveKind.Inflict:
      return `${STATUS_INFO[mv.status].name} ${mv.area ? 'a todos los rivales' : 'a un rival sin estado'}${accuracy(mv)}`
  }
}

import { EffectKind, hasArea, MoveClass, moveClass, STAT_NAME, type IncursionMove, type MoveEffect, type StatChange } from '../../data/incursionMoves'
import { STATUS_INFO } from '../../data/passives'

// Cómo se cuenta en pantalla lo que hace cada ataque de incursión, a partir de su clase, potencia y efectos.

export const CLASS_LABEL: Record<MoveClass, string> = {
  [MoveClass.Damage]: 'Daño',
  [MoveClass.Heal]: 'Cura',
  [MoveClass.Status]: 'Estado',
}

const pct = (n: number) => `${Math.round(Math.abs(n) * 100)}%`
const stats = (changes: StatChange[]) => changes.map((c) => `${STAT_NAME[c.stat]} ${c.stages > 0 ? '+' : '−'}${Math.abs(c.stages)}`).join(' y ')

function effectText(e: MoveEffect, area: boolean): string | null {
  switch (e.kind) {
    case EffectKind.Drain:
      return `recupera el ${pct(e.fraction)} del daño`
    case EffectKind.HealAlly:
      return `cura al aliado con menos PS${e.fraction !== 1 ? ` (×${e.fraction})` : ''}`
    case EffectKind.HealTeam:
      return `cura a todo el grupo${e.fraction !== 1 ? ` (×${e.fraction})` : ''}`
    case EffectKind.Inflict:
      return `${e.chance < 1 ? `${pct(e.chance)} de ` : ''}${STATUS_INFO[e.status].name.toLowerCase()}${area ? ' a todos' : ''}`
    case EffectKind.Raise:
      return `sube ${stats(e.changes)} ${e.self ? 'a sí mismo' : 'al grupo'}`
    case EffectKind.Lower:
      return `baja ${stats(e.changes)}${area ? ' a todos los rivales' : ' a un rival'}`
    case EffectKind.Taunt:
      return `atrae los golpes ${e.turns} turnos y recibe un ${pct(e.guard)} menos`
    case EffectKind.Area:
      return null
  }
}

/** Lo que mejora al potenciarlo con los toques */
function tapText(mv: IncursionMove): string {
  const what = { [MoveClass.Damage]: 'daño', [MoveClass.Heal]: 'cura', [MoveClass.Status]: 'daño y cura del grupo' }[moveClass(mv)]
  return `${mv.tapGoal} toques: +${pct(mv.tapBonus)} de ${what}`
}

export function moveText(mv: IncursionMove): string {
  const area = hasArea(mv)
  const cls = moveClass(mv)
  const head = cls === MoveClass.Damage ? `Pot. ${mv.power}${area ? ' a todos los rivales' : ''}` : cls === MoveClass.Heal ? `Cura de pot. ${mv.power}` : ''
  const effects = mv.effects.map((e) => effectText(e, area)).filter(Boolean)
  const accuracy = mv.accuracy < 100 ? `Prec. ${mv.accuracy}%` : ''
  const priority = mv.priority !== 0 ? `Prioridad ${mv.priority > 0 ? '+' : '−'}${Math.abs(mv.priority)}` : ''
  const text = [head, ...effects, priority, accuracy, tapText(mv)].filter(Boolean).join(' · ')
  return text.charAt(0).toUpperCase() + text.slice(1)
}

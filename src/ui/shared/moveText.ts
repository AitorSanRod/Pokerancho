import { EffectKind, hasArea, hitsAllies, MoveClass, moveClass, STAT_NAME, type IncursionMove, type MoveEffect, type StatChange } from '../../data/incursionMoves'
import { STATUS_INFO } from '../../data/passives'
import { TapKind } from '../../data/incursionMoves'
import { tapChallengeOf } from '../../game/incursion/tapChallenge'

// Cómo se cuenta en pantalla lo que hace cada ataque de incursión, a partir de su clase, potencia y efectos.

export const CLASS_LABEL: Record<MoveClass, string> = {
  [MoveClass.Damage]: 'Daño',
  [MoveClass.Heal]: 'Cura',
  [MoveClass.Status]: 'Estado',
}

const pct = (n: number) => `${Math.round(Math.abs(n) * 100)}%`
const stats = (changes: StatChange[]) => changes.map((c) => `${STAT_NAME[c.stat]} ${c.stages > 0 ? '+' : '−'}${Math.abs(c.stages)}`).join(' y ')

/** A quién da, si es de área */
function areaText(mv: IncursionMove): string | null {
  if (!hasArea(mv)) return null
  return hitsAllies(mv) ? 'a todos, también a su grupo' : 'a todos los rivales'
}

function effectText(e: MoveEffect, area: string | null): string | null {
  switch (e.kind) {
    case EffectKind.Drain:
      return `recupera el ${pct(e.fraction)} del daño`
    case EffectKind.HealAlly:
      return `cura al aliado con menos PS${e.fraction !== 1 ? ` (×${e.fraction})` : ''}`
    case EffectKind.HealTeam:
      return `cura a todo el grupo${e.fraction !== 1 ? ` (×${e.fraction})` : ''}`
    case EffectKind.Inflict:
      return `${e.chance < 1 ? `${pct(e.chance)} de ` : ''}${STATUS_INFO[e.status].name.toLowerCase()}${area ? ` ${area}` : ''}`
    case EffectKind.Raise:
      return `sube ${stats(e.changes)} ${e.self ? 'a sí mismo' : 'al grupo'}`
    case EffectKind.Lower:
      return `baja ${stats(e.changes)} ${area ?? 'a un rival'}`
    case EffectKind.Taunt:
      return `atrae los golpes ${e.turns} turnos y recibe un ${pct(e.guard)} menos`
    case EffectKind.Area:
      return null
  }
}

/** Lo que da acertar todos los anillos, por clase de ataque */
const PERFECT: Record<MoveClass, string> = {
  [MoveClass.Damage]: 'crítico',
  [MoveClass.Heal]: 'cura crítica',
  [MoveClass.Status]: 'más mejora al grupo',
}

/** Su reto de la ventana de toques y lo que mejora */
function tapText(mv: IncursionMove): string {
  const what = { [MoveClass.Damage]: 'daño', [MoveClass.Heal]: 'cura', [MoveClass.Status]: 'daño y cura del grupo' }[moveClass(mv)]
  const ch = tapChallengeOf(mv)
  if (ch.kind === TapKind.Mash) return `Toques: hasta ${ch.goal}, +${pct(ch.bonus)} de ${what} según los que hagas`
  const count = ch.min === ch.max ? `${ch.min}` : `de ${ch.min} a ${ch.max}`
  return `Toques: ${count} ${ch.max > 1 ? 'anillos' : 'anillo'}, ${PERFECT[moveClass(mv)]} si los aciertas todos`
}

/** En las rutas, la torre y la raid solo cuenta el golpe: potencia y precisión */
export const strikeMeta = (mv: IncursionMove) => `Pot. ${mv.power} · Prec. ${mv.accuracy}%`

/** «Daño · Pot. 40»; los de estado, solo su clase */
export const classMeta = (mv: IncursionMove) =>
  [CLASS_LABEL[moveClass(mv)], moveClass(mv) === MoveClass.Status ? '' : `Pot. ${mv.power}`].filter(Boolean).join(' · ')

/** Lo que hace el ataque; con `taps` a false, sin lo de los toques (que es de las incursiones) */
export function moveText(mv: IncursionMove, { taps = true } = {}): string {
  const area = areaText(mv)
  const cls = moveClass(mv)
  const head = cls === MoveClass.Damage ? `Pot. ${mv.power}${area ? ` ${area}` : ''}` : cls === MoveClass.Heal ? `Cura de pot. ${mv.power}` : ''
  const effects = mv.effects.map((e) => effectText(e, area)).filter(Boolean)
  const accuracy = mv.accuracy < 100 ? `Prec. ${mv.accuracy}%` : ''
  const priority = mv.priority !== 0 ? `Prioridad ${mv.priority > 0 ? '+' : '−'}${Math.abs(mv.priority)}` : ''
  const text = [head, ...effects, priority, accuracy, taps ? tapText(mv) : ''].filter(Boolean).join(' · ')
  return text.charAt(0).toUpperCase() + text.slice(1)
}

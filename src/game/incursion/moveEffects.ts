import { EffectKind, effectOf, hasArea, MoveClass, moveClass, STAT_NAME, type IncursionMove, type StatChange } from '../../data/incursionMoves'
import type { MissReason } from '../battle/battle'
import type { Rng } from '../core/random'
import { damage } from '../battle/attack'
import { allies, enemies, hurt, restore, type Battlefield } from './battlefield'
import { EventKind, on } from './events'
import { damageSide, isUp, type GroupFighter } from './fighter'
import { inflict } from './groupStatus'
import { healAmount } from './healing'
import { addStages } from './statStages'
import { tapMult } from './tapWindow'
import { debuffTarget, healTarget, inflictTarget, strikeTarget } from './targeting'

// Qué hace cada movimiento en una incursión según su clase (data/incursionMoves): los de daño golpean y luego aplican
// sus efectos al golpeado, los de cura convierten su potencia en PS y los de estado aplican sus efectos. `bossArea`: el
// golpe de un jefe que da a todo el grupo (bossMechanics.ts).

/** Fracción del daño normal que hace a cada uno un golpe en área */
export const AREA_DAMAGE_MULT = 0.6

const MISS_TEXT: Record<MissReason, string> = { miss: '¡Pero falló!', dodge: '¡Lo esquivó!', immune: 'No afecta…' }

const hits = (rng: Rng, accuracy: number) => accuracy >= 100 || rng() * 100 < accuracy

/** Anota que el golpe no hizo nada (y por qué); el daño hecho es 0 */
function miss(bf: Battlefield, actor: GroupFighter, target: GroupFighter, reason: MissReason): number {
  bf.log(on(target, { kind: EventKind.Miss, actor: actor.id, miss: reason, text: MISS_TEXT[reason] }))
  return 0
}

/** Un golpe a un rival: puede fallar, esquivarlo o salir un crítico; quien provoca recibe menos. Devuelve el daño hecho */
function strike(bf: Battlefield, actor: GroupFighter, target: GroupFighter, mv: IncursionMove, mult: number, rng: Rng): number {
  if (!hits(rng, mv.accuracy)) return miss(bf, actor, target, 'miss')
  if (target.bonus.dodge > 0 && rng() < target.bonus.dodge) return miss(bf, actor, target, 'dodge')
  const { dealt, eff, crit } = damage(damageSide(actor), damageSide(target), mv, rng)
  if (eff === 0) return miss(bf, actor, target, 'immune')
  const boost = tapMult(bf, actor)
  const taken = Math.max(1, Math.floor(dealt * mult * boost * (1 - (target.taunt?.guard ?? 0))))
  const note = [crit ? '¡Crítico!' : '', eff > 1 ? '¡Es muy eficaz!' : eff < 1 ? 'No es muy eficaz…' : ''].filter(Boolean).join(' ')
  hurt(bf, target, taken, { kind: EventKind.Hit, actor: actor.id, crit, eff, potent: boost > 1, type: mv.type, text: note })
  if (actor.bonus.drain > 0) restore(bf, actor, taken * actor.bonus.drain)
  if (isUp(target)) for (const { status, chance } of actor.bonus.inflicts) if (rng() < chance) inflict(bf, target, status)
  return taken
}

/** Cómo lo cuentan los juegos: cuántas etapas se aplicaron de las que pedía */
function stageText(name: string, c: StatChange, applied: number): string {
  const stat = `${STAT_NAME[c.stat]} de ${name}`
  if (applied === 0) return c.stages > 0 ? `¡${stat} no puede subir más!` : `¡${stat} no puede bajar más!`
  return `¡${stat} ${applied > 0 ? 'subió' : 'bajó'}${Math.abs(applied) > 1 ? ' mucho' : ''}!`
}

/** Suma (o resta) etapas de stats, sin pasar del tope: si ya está al tope, no hace nada */
function change(bf: Battlefield, f: GroupFighter, changes: StatChange[]) {
  const text = changes.map((c) => stageText(f.name, c, addStages(f.stages, c.stat, c.stages))).join(' ')
  bf.log(on(f, { kind: EventKind.Change, text }))
}

/** Lo que va a su propio lado: subir stats (al grupo o a sí mismo) y provocar */
function ownSideEffects(bf: Battlefield, actor: GroupFighter, mv: IncursionMove) {
  const raise = effectOf(mv, EffectKind.Raise)
  if (raise) for (const t of raise.self ? [actor] : allies(bf, actor)) change(bf, t, raise.changes)
  const taunt = effectOf(mv, EffectKind.Taunt)
  if (!taunt) return
  actor.taunt = { turns: taunt.turns, guard: taunt.guard }
  bf.log(on(actor, { kind: EventKind.Taunt, actor: actor.id, text: `${actor.name} atrae los golpes.` }))
}

/** Lo que va a un rival ya elegido: el estado (con su probabilidad) y la bajada de stats. Devuelve si le hizo algo */
function onFoe(bf: Battlefield, mv: IncursionMove, foe: GroupFighter, rng: Rng): boolean {
  if (!isUp(foe)) return false
  const status = effectOf(mv, EffectKind.Inflict)
  const inflicted = !!status && rng() < status.chance && inflict(bf, foe, status.status)
  const lower = effectOf(mv, EffectKind.Lower)
  if (lower) change(bf, foe, lower.changes)
  return inflicted || !!lower
}

function damageMove(bf: Battlefield, actor: GroupFighter, mv: IncursionMove, rng: Rng, bossArea: boolean) {
  const area = bossArea || hasArea(mv)
  const targets = area ? enemies(bf, actor) : [strikeTarget(bf, actor, mv.type, rng)]
  const drain = effectOf(mv, EffectKind.Drain)
  for (const t of targets) {
    if (!t) continue
    const dealt = strike(bf, actor, t, mv, area ? AREA_DAMAGE_MULT : 1, rng)
    if (dealt === 0) continue
    if (drain) restore(bf, actor, dealt * drain.fraction)
    onFoe(bf, mv, t, rng)
  }
  ownSideEffects(bf, actor, mv)
}

function healMove(bf: Battlefield, actor: GroupFighter, mv: IncursionMove) {
  const amount = healAmount(actor, mv.power) * tapMult(bf, actor)
  const one = effectOf(mv, EffectKind.HealAlly)
  const target = one && healTarget(bf, actor)
  if (one && target) restore(bf, target, amount * one.fraction)
  const team = effectOf(mv, EffectKind.HealTeam)
  if (team) for (const t of allies(bf, actor)) restore(bf, t, amount * team.fraction)
  ownSideEffects(bf, actor, mv)
}

function statusMove(bf: Battlefield, actor: GroupFighter, mv: IncursionMove, rng: Rng) {
  ownSideEffects(bf, actor, mv)
  const inflicts = !!effectOf(mv, EffectKind.Inflict)
  if (!inflicts && !effectOf(mv, EffectKind.Lower)) return
  if (!hits(rng, mv.accuracy)) return void miss(bf, actor, actor, 'miss')
  const single = inflicts ? inflictTarget(bf, actor, rng) : debuffTarget(bf, actor)
  const targets = hasArea(mv) ? enemies(bf, actor) : single ? [single] : []
  if (!targets.filter((t) => onFoe(bf, mv, t, rng)).length) miss(bf, actor, actor, 'miss')
}

export function performMove(bf: Battlefield, actor: GroupFighter, rng: Rng, bossArea = false) {
  const mv = actor.move
  bf.log({ kind: EventKind.Move, actor: actor.id, moveId: mv.id, text: `${actor.name} usó ${mv.name}.` })
  const cls = moveClass(mv)
  if (cls === MoveClass.Damage) damageMove(bf, actor, mv, rng, bossArea)
  else if (cls === MoveClass.Heal) healMove(bf, actor, mv)
  else statusMove(bf, actor, mv, rng)
}

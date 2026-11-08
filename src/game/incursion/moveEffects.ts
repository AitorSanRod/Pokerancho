import type { DamageMove } from '../../data/learnsets'
import { MoveKind, type StatChange } from '../../data/supportMoves'
import type { Rng } from '../core/random'
import { damage } from '../battle/attack'
import { allies, enemies, hurt, restore, type Battlefield } from './battlefield'
import { EventKind, on } from './events'
import { damageSide, isUp, type GroupFighter } from './fighter'
import { inflict } from './groupStatus'
import { debuffTarget, healTarget, inflictTarget, strikeTarget } from './targeting'

// Qué hace cada movimiento en una incursión. `area`: el golpe de un jefe que da a todo el grupo (bossMechanics.ts).

/** Fracción del daño normal que hace a cada uno un golpe en área de un jefe */
export const AREA_DAMAGE_MULT = 0.6

const hits = (rng: Rng, accuracy: number) => accuracy >= 100 || rng() * 100 < accuracy

/** Un golpe a un rival: puede fallar, esquivarlo o salir un crítico; quien provoca recibe menos */
function strike(bf: Battlefield, actor: GroupFighter, target: GroupFighter, mv: DamageMove, mult: number, rng: Rng) {
  if (!hits(rng, mv.accuracy)) return bf.log(on(target, { kind: EventKind.Miss, actor: actor.id, miss: 'miss', text: '¡Pero falló!' }))
  if (target.bonus.dodge > 0 && rng() < target.bonus.dodge) {
    return bf.log(on(target, { kind: EventKind.Miss, actor: actor.id, miss: 'dodge', text: '¡Lo esquivó!' }))
  }
  const { dealt, eff, crit } = damage(damageSide(actor), damageSide(target), mv, rng)
  if (eff === 0) return bf.log(on(target, { kind: EventKind.Miss, actor: actor.id, miss: 'immune', text: `No afecta a ${target.name}…` }))
  const taken = Math.max(1, Math.floor(dealt * mult * (1 - (target.taunt?.guard ?? 0))))
  const note = [crit ? '¡Crítico!' : '', eff > 1 ? '¡Es muy eficaz!' : eff < 1 ? 'No es muy eficaz…' : ''].filter(Boolean).join(' ')
  hurt(bf, target, taken, { kind: EventKind.Hit, actor: actor.id, crit, eff, type: mv.type, text: note })
  if (actor.bonus.drain > 0) restore(bf, actor, taken * actor.bonus.drain)
  if (!isUp(target)) return
  for (const { status, chance } of actor.bonus.inflicts) if (rng() < chance) inflict(bf, target, status)
}

/** Pone (o renueva, si es el mismo movimiento) un cambio de stats */
function change(bf: Battlefield, f: GroupFighter, moveId: string, changes: StatChange[], turns: number) {
  f.changes = [...f.changes.filter((c) => c.moveId !== moveId), ...changes.map((c) => ({ ...c, moveId, turns }))]
  const up = changes.every((c) => c.amount > 0)
  bf.log(on(f, { kind: EventKind.Change, text: up ? `Suben las stats de ${f.name}` : `Bajan las stats de ${f.name}` }))
}

const missed = (bf: Battlefield, actor: GroupFighter) =>
  bf.log(on(actor, { kind: EventKind.Miss, actor: actor.id, miss: 'miss', text: '¡Pero falló!' }))

export function performMove(bf: Battlefield, actor: GroupFighter, rng: Rng, area = false) {
  const mv = actor.move
  bf.log({ kind: EventKind.Move, actor: actor.id, moveId: mv.id, text: `${actor.name} usó ${mv.name}.` })
  switch (mv.kind) {
    case MoveKind.Damage: {
      const targets = area ? enemies(bf, actor) : [strikeTarget(bf, actor, mv.type, rng)]
      for (const t of targets) if (t) strike(bf, actor, t, mv, area ? AREA_DAMAGE_MULT : 1, rng)
      return
    }
    case MoveKind.Heal: {
      const targets = mv.area ? allies(bf, actor) : [healTarget(bf, actor)]
      for (const t of targets) if (t) restore(bf, t, t.maxHp * mv.heal)
      return
    }
    case MoveKind.Taunt:
      actor.taunt = { turns: mv.turns, guard: mv.guard }
      return bf.log(on(actor, { kind: EventKind.Taunt, actor: actor.id, text: `${actor.name} atrae los golpes.` }))
    case MoveKind.Boost:
      for (const t of allies(bf, actor)) change(bf, t, mv.id, mv.changes, mv.turns)
      return
    case MoveKind.Debuff: {
      if (!hits(rng, mv.accuracy)) return missed(bf, actor)
      const targets = mv.area ? enemies(bf, actor) : [debuffTarget(bf, actor)]
      for (const t of targets) if (t) change(bf, t, mv.id, mv.changes, mv.turns)
      return
    }
    case MoveKind.Inflict: {
      const targets = mv.area ? enemies(bf, actor) : [inflictTarget(bf, actor, rng)]
      const landed = targets.filter((t) => t && hits(rng, mv.accuracy) && inflict(bf, t, mv.status))
      if (landed.length === 0) missed(bf, actor)
    }
  }
}

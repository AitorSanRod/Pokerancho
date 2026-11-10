import { STATUS_INFO, type StatusId } from '../../data/passives'
import type { Rng } from '../core/random'
import { hurt, restore, type Battlefield } from './battlefield'
import { EventKind, on } from './events'
import { isUp, type GroupFighter } from './fighter'

// Estados alterados en las incursiones: los mismos de las rutas (data/passives.ts › STATUS_INFO), para N contra M. Duran
// como mucho STATUS_MAX_TURNS turnos (volver a ponerlo reinicia la cuenta) y se quitan al acabar la sala.

/** Turnos que dura como mucho un estado alterado (se renueva si se lo vuelven a poner) */
export const STATUS_MAX_TURNS = 5

/** Fracción de sus PS máximos que se quita un Pokémon confuso al golpearse a sí mismo */
export const CONFUSION_SELF_HIT = 0.1

/**
 * Le pone un estado si está en pie y no tiene otro (el mismo, se renueva: vuelve a durar STATUS_MAX_TURNS); devuelve si
 * se lo puso
 */
export function inflict(bf: Battlefield, f: GroupFighter, status: StatusId): boolean {
  if ((f.status && f.status !== status) || !isUp(f)) return false
  f.status = status
  f.statusTurns = STATUS_MAX_TURNS
  f.frozenTurns = STATUS_INFO[status].skipTurns ?? 0
  bf.log(on(f, { kind: EventKind.Status, status, text: `¡${f.name} ${STATUS_INFO[status].verb}!` }))
  return true
}

/** Antes de actuar: si el estado le hace perder el turno. La confusión puede hacerle golpearse a sí mismo */
export function loseTurn(bf: Battlefield, f: GroupFighter, rng: Rng): boolean {
  if (!f.status) return false
  const status = f.status
  const info = STATUS_INFO[status]
  if (f.frozenTurns > 0) {
    f.frozenTurns--
    if (f.frozenTurns === 0) f.status = null
    bf.log(on(f, { kind: EventKind.Status, status, text: `${f.name} está congelado y no se mueve.` }))
    return true
  }
  if (info.skipChance && rng() < info.skipChance) {
    bf.log(on(f, { kind: EventKind.Status, status, text: `${f.name} está paralizado y no se mueve.` }))
    return true
  }
  if (info.selfHitChance && rng() < info.selfHitChance) {
    const dealt = Math.min(f.hp - 1, Math.max(1, Math.floor(f.maxHp * CONFUSION_SELF_HIT)))
    f.hp -= dealt
    bf.log(on(f, { kind: EventKind.Hit, status, amount: dealt, text: 'Se hirió' }))
    return true
  }
  return false
}

/**
 * Final del turno: quemadura y veneno quitan PS, se regenera quien pueda y se gastan los turnos de los cambios y de los
 * estados (al acabarse, se le pasa)
 */
export function endOfTurn(bf: Battlefield) {
  const everyone = [...bf.party, ...bf.foes]
  for (const f of everyone.filter(isUp)) {
    const perTurn = f.status ? STATUS_INFO[f.status].damagePerTurn : undefined
    if (!perTurn) continue
    hurt(bf, f, Math.max(1, Math.floor(f.maxHp * perTurn)), { kind: EventKind.Hit, status: f.status!, text: STATUS_INFO[f.status!].name })
  }
  for (const f of everyone.filter(isUp)) if (f.bonus.regen > 0) restore(bf, f, f.maxHp * f.bonus.regen)
  for (const f of everyone.filter((p) => isUp(p) && p.status)) wearOff(bf, f)
  for (const f of everyone) {
    f.changes = f.changes.map((c) => ({ ...c, turns: c.turns - 1 })).filter((c) => c.turns > 0)
    if (f.taunt) f.taunt = f.taunt.turns > 1 ? { ...f.taunt, turns: f.taunt.turns - 1 } : null
  }
}

/** Gasta un turno del estado; al acabarse, se le pasa */
function wearOff(bf: Battlefield, f: GroupFighter) {
  const status = f.status!
  f.statusTurns--
  if (f.statusTurns > 0) return
  clearStatus(f)
  bf.log(on(f, { kind: EventKind.Recover, status, text: `A ${f.name} se le pasó: ${STATUS_INFO[status].name}.` }))
}

/** Le quita el estado alterado (al pasársele o al acabar la sala) */
export function clearStatus(f: GroupFighter) {
  f.status = null
  f.frozenTurns = 0
  f.statusTurns = 0
}

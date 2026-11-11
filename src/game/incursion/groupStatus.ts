import { STATUS_INFO, StatusId } from '../../data/passives'
import type { Rng } from '../core/random'
import { hurt, restore, type Battlefield } from './battlefield'
import { EventKind, on } from './events'
import { isUp, type Affliction, type GroupFighter } from './fighter'

// Estados alterados en las incursiones: los mismos de las rutas (data/passives.ts › STATUS_INFO), para N contra M. Cada
// uno lleva un estado como mucho; los jefes, hasta BOSS_MAX_STATUSES distintos a la vez. Duran como mucho
// STATUS_MAX_TURNS turnos (volver a ponerlo reinicia la cuenta) y se quitan al acabar la sala. Dormido o congelado, se
// libra a los pocos turnos (HOLDS), no como en las rutas.

/** Turnos que dura como mucho un estado alterado (se renueva si se lo vuelven a poner) */
export const STATUS_MAX_TURNS = 5

/** Estados alterados distintos que puede llevar a la vez un jefe (los demás combatientes, uno) */
export const BOSS_MAX_STATUSES = 3

/** Fracción de sus PS máximos que se quita un Pokémon confuso al golpearse a sí mismo */
export const CONFUSION_SELF_HIT = 0.1

/** Fracción de sus PS máximos que puede quitarle a un jefe, como mucho, cada estado por turno (quemadura, veneno) */
export const BOSS_STATUS_DAMAGE_CAP = 0.05

/**
 * Sueño: probabilidad de despertarse al llegarle el turno según los que ya lleva dormido (0, 1, 2…); si se despierta,
 * ataca ese mismo turno. Pasada la lista, se despierta seguro
 */
export const SLEEP_WAKE_CHANCES = [0, 0.25, 0.75]

/** Congelación: turnos que pierde, de 1 a este número, todos igual de probables */
export const FREEZE_MAX_TURNS = 3

/** Estados que le dejan sin moverse hasta que se libra: probabilidad de librarse según los turnos ya perdidos y textos */
interface Hold {
  release: (heldTurns: number) => number
  stuck: string
  freed: string
}

const HOLDS: Partial<Record<StatusId, Hold>> = {
  [StatusId.Sleep]: { release: (held) => SLEEP_WAKE_CHANCES[held] ?? 1, stuck: 'está dormido', freed: 'se despertó' },
  // 1/3, luego 1/2, luego seguro: así pierde 1, 2 o 3 turnos con la misma probabilidad
  [StatusId.Freeze]: {
    release: (held) => (held === 0 ? 0 : 1 / Math.max(1, FREEZE_MAX_TURNS + 1 - held)),
    stuck: 'está congelado y no se mueve',
    freed: 'se descongeló',
  },
}

const maxStatuses =(f: GroupFighter): number => (f.boss ? BOSS_MAX_STATUSES : 1)

/** PS que le quita al final del turno un estado de esa fracción de sus PS máximos (a un jefe, con tope) */
const statusHarm = (f: GroupFighter, fraction: number): number =>
  Math.max(1, Math.floor(f.maxHp * (f.boss ? Math.min(fraction, BOSS_STATUS_DAMAGE_CAP) : fraction)))

export const hasStatus = (f: GroupFighter, status: StatusId): boolean => f.statuses.some((a) => a.status === status)

/** Si le cabe un estado nuevo (sin contar renovar uno que ya lleva) */
export const hasStatusRoom = (f: GroupFighter): boolean => f.statuses.length < maxStatuses(f)

/**
 * Le pone un estado si está en pie y le cabe (el mismo, se renueva: vuelve a durar STATUS_MAX_TURNS); devuelve si se lo
 * puso
 */
export function inflict(bf: Battlefield, f: GroupFighter, status: StatusId): boolean {
  if (!isUp(f) || (!hasStatus(f, status) && !hasStatusRoom(f))) return false
  const fresh: Affliction = { status, turns: STATUS_MAX_TURNS, heldTurns: 0 }
  f.statuses = [...f.statuses.filter((a) => a.status !== status), fresh]
  bf.log(on(f, { kind: EventKind.Status, status, text: `¡${f.name} ${STATUS_INFO[status].verb}!` }))
  return true
}

/**
 * Antes de actuar: si alguno de sus estados le hace perder el turno. Dormido o congelado, puede librarse (y actuar ya
 * este turno); la parálisis le deja quieto a veces y la confusión puede hacerle golpearse a sí mismo
 */
export function loseTurn(bf: Battlefield, f: GroupFighter, rng: Rng): boolean {
  for (const held of f.statuses.filter((a) => HOLDS[a.status])) {
    const hold = HOLDS[held.status]!
    if (rng() < hold.release(held.heldTurns)) {
      cure(bf, f, held, `¡${f.name} ${hold.freed}!`)
      continue
    }
    held.heldTurns++
    bf.log(on(f, { kind: EventKind.Status, status: held.status, text: `${f.name} ${hold.stuck}.` }))
    return true
  }
  return f.statuses.some(({ status }) => skipsTurn(bf, f, status, rng))
}

/** Si este estado le hace perder el turno ahora (parálisis) o golpearse a sí mismo (confusión) */
function skipsTurn(bf: Battlefield, f: GroupFighter, status: StatusId, rng: Rng): boolean {
  const info = STATUS_INFO[status]
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
 * Final del turno: quemadura y veneno quitan PS (cada uno lo suyo), se regenera quien pueda y se gastan los turnos de
 * los cambios y de los estados (al acabarse, se le pasa)
 */
export function endOfTurn(bf: Battlefield) {
  const everyone = [...bf.party, ...bf.foes]
  for (const f of everyone) for (const { status } of f.statuses) statusDamage(bf, f, status)
  for (const f of everyone.filter(isUp)) if (f.bonus.regen > 0) restore(bf, f, f.maxHp * f.bonus.regen)
  for (const f of everyone.filter(isUp)) wearOff(bf, f)
  for (const f of everyone) if (f.taunt) f.taunt = f.taunt.turns > 1 ? { ...f.taunt, turns: f.taunt.turns - 1 } : null
}

function statusDamage(bf: Battlefield, f: GroupFighter, status: StatusId) {
  const perTurn = STATUS_INFO[status].damagePerTurn
  if (!perTurn || !isUp(f)) return
  hurt(bf, f, statusHarm(f, perTurn), { kind: EventKind.Hit, status, text: STATUS_INFO[status].name })
}

/** Gasta un turno de cada estado; los que se acaban, se le pasan */
function wearOff(bf: Battlefield, f: GroupFighter) {
  for (const a of f.statuses) a.turns--
  for (const a of f.statuses.filter((a) => a.turns <= 0)) cure(bf, f, a)
}

/** Se le pasa ese estado (con su texto, o el de siempre) */
function cure(bf: Battlefield, f: GroupFighter, gone: Affliction, text = `A ${f.name} se le pasó: ${STATUS_INFO[gone.status].name}.`) {
  f.statuses = f.statuses.filter((a) => a !== gone)
  bf.log(on(f, { kind: EventKind.Recover, status: gone.status, text }))
}

/** Le quita los estados alterados (al acabar la sala o al revivir) */
export function clearStatus(f: GroupFighter) {
  f.statuses = []
}

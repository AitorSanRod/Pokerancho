import { EffectKind, type MoveEffect, type StatChange } from '../../data/incursionMoves'
import type { Move } from '../../data/moves'
import type { Rng } from '../core/random'
import { label, type Fighter, type Push } from './battle'
import { addStages, stageText } from './statStages'
import { inflictStatus } from './status'

// Los efectos del ataque de combate del jugador en un combate de ruta o de torre: los mismos que en las incursiones
// (incursion/moveEffects.ts), en un uno contra uno. Drenar, poner estado y bajar stats van al golpeado; subir stats, a
// quien ataca (también los que en la incursión suben a todo el grupo). Los de área dan al único rival con menos daño
// (AREA_DAMAGE_MULT, como contra un solo rival en la incursión); provocar no hace nada: no hay golpes que atraer.

const effectOf = <K extends EffectKind>(mv: Move, kind: K): Extract<MoveEffect, { kind: K }> | undefined =>
  mv.effects?.find((e) => e.kind === kind) as Extract<MoveEffect, { kind: K }> | undefined

/** Si el ataque es de área */
export const isAreaMove = (mv: Move): boolean => !!effectOf(mv, EffectKind.Area)

/** Suma (o resta) etapas de stats sin pasar del tope y lo anuncia */
function changeStages(f: Fighter, changes: StatChange[], push: Push) {
  const applied = changes.map((c) => ({ stat: c.stat, applied: addStages(f.stages, c.stat, c.stages) }))
  const text = changes.map((c, i) => stageText(label(f), c, applied[i].applied)).join(' ')
  push({ kind: 'stat', side: f.side, stages: applied, text })
}

/** Recupera PS (sin pasar del máximo) y lo anuncia */
export function heal(f: Fighter, amount: number, push: Push) {
  const healed = Math.min(f.maxHp - f.hp, Math.ceil(amount))
  if (healed <= 0) return
  f.hp += healed
  push({ kind: 'heal', side: f.side, text: `+${healed} PS` })
}

/** Tras un golpe que quitó `taken` PS al rival: quien ataca recupera esa parte (como Absorber) */
export function drainOnHit(atk: Fighter, mv: Move, taken: number, push: Push) {
  const drain = effectOf(mv, EffectKind.Drain)
  if (drain) heal(atk, taken * drain.fraction, push)
}

/** Tras un golpe al rival que sigue en pie: le pone su estado (con su probabilidad) y le baja stats */
export function onFoeHit(def: Fighter, mv: Move, push: Push, rng: Rng) {
  const status = effectOf(mv, EffectKind.Inflict)
  if (status && rng() < status.chance) inflictStatus(def, status.status, push)
  const lower = effectOf(mv, EffectKind.Lower)
  if (lower) changeStages(def, lower.changes, push)
}

/** Lo que va a quien ataca, acierte o no: subir sus stats */
export function onSelf(atk: Fighter, mv: Move, push: Push) {
  const raise = effectOf(mv, EffectKind.Raise)
  if (raise) changeStages(atk, raise.changes, push)
}

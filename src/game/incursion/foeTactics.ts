import { EffectKind, hasArea, MoveClass, moveClass, type IncursionMove, type StatChange } from '../../data/incursionMoves'
import type { Rng } from '../core/random'
import { allies, enemies, type Battlefield } from './battlefield'
import type { GroupFighter } from './fighter'
import { MAX_STAGES } from './statStages'
import { debuffTarget, taunter } from './targeting'

// Qué ataque usa un rival de los que lleva, de forma más o menos coherente: no repite lo que ya no hace nada (confundir a
// un confundido, subir una stat al tope, provocar si ya provoca…), cura si a su bando le hace falta y, en un turno de
// golpe en área de un jefe, pega.

/** Un rival cura a su bando cuando a alguno le queda menos de esta fracción de sus PS */
export const FOE_HEAL_BELOW = 0.5

const hasRoom = (f: GroupFighter, changes: StatChange[]) =>
  changes.some((c) => (c.stages > 0 ? f.stages[c.stat] < MAX_STAGES : f.stages[c.stat] > -MAX_STAGES))

/** Si el ataque, ahora mismo, haría algo */
export function isUseful(bf: Battlefield, f: GroupFighter, mv: IncursionMove): boolean {
  const cls = moveClass(mv)
  if (cls === MoveClass.Damage) return true
  if (cls === MoveClass.Heal) return allies(bf, f).some((a) => a.hp / a.maxHp < FOE_HEAL_BELOW)
  return mv.effects.some((e) => {
    switch (e.kind) {
      case EffectKind.Inflict: {
        const forced = taunter(bf, f)
        return forced ? !forced.status : enemies(bf, f).some((t) => !t.status)
      }
      case EffectKind.Raise:
        return (e.self ? [f] : allies(bf, f)).some((t) => hasRoom(t, e.changes))
      case EffectKind.Lower: {
        const targets = hasArea(mv) ? enemies(bf, f) : [debuffTarget(bf, f)].filter((t) => t !== null)
        return targets.some((t) => hasRoom(t, e.changes))
      }
      case EffectKind.Taunt:
        return !f.taunt
      default:
        return false
    }
  })
}

/**
 * El ataque de este turno: en un turno de área, uno de daño; si a su bando le hace falta, uno de cura; si no, uno al azar
 * entre los que harían algo (si ninguno, el primero)
 */
export function chooseFoeMove(bf: Battlefield, f: GroupFighter, rng: Rng, areaTurn: boolean): IncursionMove {
  const useful = f.moves.filter((mv) => isUseful(bf, f, mv))
  const damaging = useful.filter((mv) => moveClass(mv) === MoveClass.Damage)
  if (areaTurn && damaging.length) return pick(damaging, rng)
  const heals = useful.filter((mv) => moveClass(mv) === MoveClass.Heal)
  if (heals.length) return pick(heals, rng)
  return useful.length ? pick(useful, rng) : f.moves[0]
}

const pick = <T>(list: T[], rng: Rng): T => list[Math.floor(rng() * list.length)]

/** Si con este ataque ya no haría nada (otro se adelantó), cambia a otro que sí */
export const stillUseful = (bf: Battlefield, f: GroupFighter, rng: Rng, areaTurn: boolean): IncursionMove =>
  isUseful(bf, f, f.move) ? f.move : chooseFoeMove(bf, f, rng, areaTurn)

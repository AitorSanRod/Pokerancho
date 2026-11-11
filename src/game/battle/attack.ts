import { STRUGGLE, STRUGGLE_DAMAGE, STRUGGLE_RECOIL, type Move } from '../../data/moves'
import { CRIT_MULT, STATUS_INFO } from '../../data/passives'
import { effectiveness } from '../../data/types'
import type { Rng } from '../core/random'
import { label, type Fighter, type Push } from './battle'
import { bonusVsMult } from './combatBonus'
import { blockedByStatus, inflictStatus } from './status'

/** Multiplicador de daño si el movimiento es del mismo tipo que el Pokémon */
const STAB = 1.5
/** Fracción del daño normal que se hace a sí mismo un Pokémon confuso al golpearse */
export const CONFUSION_SELF_DAMAGE = 0.5

/** Lo que la fórmula de daño necesita de cada lado (también los combatientes de las incursiones) */
export type DamageSide = Pick<Fighter, 'level' | 'types' | 'stats' | 'status' | 'bonus'>

/** Fórmula de daño de los juegos con una sola stat de ataque y otra de defensa, más quemadura y pasivas */
export function damage(atk: DamageSide, def: DamageSide, mv: Move, rng: Rng): { dealt: number; eff: number; crit: boolean } {
  const eff = effectiveness(mv.type, def.types)
  const stab = atk.types.includes(mv.type) ? STAB : 1
  const atkStat = atk.stats.atk * (atk.status ? (STATUS_INFO[atk.status].atkMult ?? 1) : 1)
  const raw = (((2 * atk.level) / 5 + 2) * mv.power * (atkStat / def.stats.def)) / 50 + 2
  const roll = 0.85 + rng() * 0.15
  // Sin pasiva no se tira el dado: así los combates sin pasivas siguen el mismo azar que antes
  const crit = atk.bonus.crit > 0 && rng() < atk.bonus.crit
  const mult = stab * eff * roll * bonusVsMult(atk.bonus, def.types) * (crit ? CRIT_MULT : 1) * (1 - def.bonus.damageReduction)
  return { dealt: eff === 0 ? 0 : Math.max(1, Math.floor(raw * mult)), eff, crit }
}

/** Recupera PS (sin pasar del máximo) y lo anuncia */
export function heal(f: Fighter, amount: number, push: Push) {
  const healed = Math.min(f.maxHp - f.hp, Math.ceil(amount))
  if (healed <= 0) return
  f.hp += healed
  push({ kind: 'heal', side: f.side, text: `+${healed} PS` })
}

/** El único ataque de `atk` no le hace nada a `def` por tipos: en su lugar usa Forcejeo */
export const mustStruggle = (atk: Fighter, def: Fighter) => effectiveness(atk.move.type, def.types) === 0

/** Forcejeo: siempre acierta, quita STRUGGLE_DAMAGE al rival y una fracción de sus PS máximos a quien lo usa */
function struggle(atk: Fighter, def: Fighter, push: Push) {
  push({ kind: 'attack', side: atk.side, struggle: true, text: `${label(atk)} usó ${STRUGGLE.name}.` })
  def.hp = Math.max(0, def.hp - STRUGGLE_DAMAGE)
  push({ kind: 'hit', side: def.side, struggle: true, text: '' })
  atk.hp = Math.max(0, atk.hp - Math.max(1, Math.ceil(atk.maxHp * STRUGGLE_RECOIL)))
  push({ kind: 'hit', side: atk.side, struggle: true, text: 'Retroceso' })
  for (const f of [def, atk]) if (f.hp === 0) push({ kind: 'faint', side: f.side, text: `¡${label(f)} se debilitó!` })
}

/**
 * Un turno de un combatiente: el estado puede impedírselo; si ataca, pueden fallar, esquivarlo o salir un crítico. Si su
 * ataque no afecta al rival por tipos, forcejea
 */
export function attack(atk: Fighter, def: Fighter, push: Push, rng: Rng) {
  const blocked = blockedByStatus(atk, push, rng)
  if (blocked === 'skip') return
  if (blocked === 'self-hit') {
    const { dealt } = damage(atk, atk, atk.move, rng)
    atk.hp = Math.max(0, atk.hp - Math.max(1, Math.floor(dealt * CONFUSION_SELF_DAMAGE)))
    push({ kind: 'hit', side: atk.side, status: atk.status!, text: 'Se hirió' })
    if (atk.hp === 0) push({ kind: 'faint', side: atk.side, text: `¡${label(atk)} se debilitó!` })
    return
  }

  if (mustStruggle(atk, def)) return struggle(atk, def, push)
  const mv = atk.move
  push({ kind: 'attack', side: atk.side, text: `${label(atk)} usó ${mv.name}.` })
  if (rng() * 100 >= mv.accuracy) return push({ kind: 'miss', side: def.side, miss: 'miss', text: '¡Pero falló!' })
  if (def.bonus.dodge > 0 && rng() < def.bonus.dodge) return push({ kind: 'miss', side: def.side, miss: 'dodge', text: '¡Lo esquivó!' })
  const { dealt, eff, crit } = damage(atk, def, mv, rng)

  def.hp = Math.max(0, def.hp - dealt)
  const note = [crit ? '¡Crítico!' : '', eff > 1 ? '¡Es muy eficaz!' : eff < 1 ? 'No es muy eficaz…' : ''].filter(Boolean).join(' ')
  push({ kind: 'hit', side: def.side, crit, eff, text: note })
  if (atk.bonus.drain > 0) heal(atk, dealt * atk.bonus.drain, push)
  if (def.hp === 0) return push({ kind: 'faint', side: def.side, text: `¡${label(def)} se debilitó!` })
  for (const { status, chance } of atk.bonus.inflicts) if (rng() < chance) inflictStatus(def, status, push)
}

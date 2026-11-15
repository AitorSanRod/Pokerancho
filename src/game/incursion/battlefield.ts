import { EventKind, on, type IncursionEvent, type Log } from './events'
import { isUp, Team, type GroupFighter } from './fighter'
import { noStages } from '../battle/statStages'
import type { GroupPassive } from './groupPassives'

// Todo lo que comparte una sala en juego: los dos bandos, los revivires que le quedan al grupo y el registro.

export interface Battlefield {
  party: GroupFighter[]
  foes: GroupFighter[]
  /** Revivires que le quedan al grupo para toda la incursión (sin `revivesEach`) */
  revives: number
  /** Revivires de cada Pokémon del grupo, en lugar de los del grupo (la raid); sin él, los del grupo */
  revivesEach?: number
  /** Con `revivesEach`: los que ha gastado ya cada uno, por su id */
  revivesSpent?: Record<string, number>
  turn: number
  /** Contador de caídas, para gastar los revivires en el orden en que cayeron */
  falls: number
  passives: GroupPassive[]
  /** Pokémon del grupo que han potenciado su ataque este turno con los toques (ver tapWindow.ts) */
  boosted: string[]
  /** Pokémon del grupo cuyo primer golpe a un rival de este turno es crítico: acertaron el toque crítico (tapWindow.ts) */
  critReady: string[]
  log: Log
}

export const allies = (bf: Battlefield, f: GroupFighter): GroupFighter[] =>
  (f.team === Team.Party ? bf.party : bf.foes).filter(isUp)

export const enemies = (bf: Battlefield, f: GroupFighter): GroupFighter[] =>
  (f.team === Team.Party ? bf.foes : bf.party).filter(isUp)

/**
 * Le quita PS y anota el golpe (`hit`, con sus PS tras él); si llega a 0, cae y pierde sus cambios de stats y su
 * provocación
 */
export function hurt(bf: Battlefield, f: GroupFighter, amount: number, hit: Omit<IncursionEvent, 'target' | 'hp' | 'maxHp'>) {
  const taken = Math.min(f.hp, amount)
  f.hp -= taken
  bf.log(on(f, { ...hit, amount: taken }))
  if (f.hp > 0) return
  f.fellAt = bf.falls++
  f.stages = noStages()
  f.taunt = null
  bf.log(on(f, { kind: EventKind.Faint, text: `¡${f.name} se debilitó!` }))
}

/** Recupera PS sin pasar del máximo y lo anuncia */
export function restore(bf: Battlefield, f: GroupFighter, amount: number) {
  const healed = Math.min(f.maxHp - f.hp, Math.ceil(amount))
  if (healed <= 0 || f.hp === 0) return
  f.hp += healed
  bf.log(on(f, { kind: EventKind.Heal, amount: healed, text: `+${healed} PS` }))
}

/** Revivires que le quedan a ese Pokémon: los suyos (con `revivesEach`) o los del grupo */
export const revivesFor = (bf: Battlefield, f: GroupFighter): number =>
  bf.revivesEach === undefined ? bf.revives : bf.revivesEach - (bf.revivesSpent?.[f.id] ?? 0)

/** Algún caído del grupo puede volver: le quedan revivires (los suyos o los del grupo) */
const anyComeback = (bf: Battlefield): boolean =>
  bf.revivesEach === undefined ? bf.revives > 0 : bf.party.some((f) => !f.out && f.hp === 0 && revivesFor(bf, f) > 0)

/** Gana la sala el grupo si no queda rival en pie; la pierde si todos han caído y ninguno puede volver */
export function roomOutcome(bf: Battlefield): 'win' | 'lose' | null {
  if (!bf.foes.some(isUp)) return 'win'
  if (!bf.party.some(isUp) && !anyComeback(bf)) return 'lose'
  return null
}

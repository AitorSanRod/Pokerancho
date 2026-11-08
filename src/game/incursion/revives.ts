import type { Battlefield } from './battlefield'
import { EventKind, on } from './events'
import type { GroupFighter } from './fighter'

// Revivires del grupo: se gastan solos, en el orden en que cayeron, al empezar el turno siguiente a la caída.

/** Revivires que tiene el grupo para toda la incursión */
export const INCURSION_REVIVES = 3
/** Fracción de los PS máximos con la que vuelve un Pokémon revivido */
export const REVIVE_HP = 0.5

/** Lo levanta con esa fracción de sus PS y sin estado (también a uno que ya no volvía); `revives`, los que quedan si gastó uno */
export function raise(bf: Battlefield, f: GroupFighter, hpFraction: number, revives?: number) {
  f.hp = Math.max(1, Math.round(f.maxHp * hpFraction))
  f.status = null
  f.frozenTurns = 0
  f.fellAt = null
  f.out = false
  bf.log(on(f, { kind: EventKind.Revive, revives, text: `¡${f.name} vuelve a la lucha!` }))
}

/** Cada caído del grupo vuelve si quedan revivires; si no, se queda fuera hasta el final (y deja de sumar pasivas) */
export function resolveFallen(bf: Battlefield) {
  const fallen = bf.party.filter((f) => f.hp === 0 && !f.out)
  fallen.sort((a, b) => (a.fellAt ?? 0) - (b.fellAt ?? 0))
  for (const f of fallen) {
    if (bf.revives > 0) {
      bf.revives--
      raise(bf, f, REVIVE_HP, bf.revives)
    } else {
      f.out = true
      bf.log(on(f, { kind: EventKind.Out, text: `${f.name} no puede seguir: solo le queda mirar.` }))
    }
  }
}

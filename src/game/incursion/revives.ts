import { revivesFor, type Battlefield } from './battlefield'
import { EventKind, on } from './events'
import type { GroupFighter } from './fighter'
import { clearStatus } from './groupStatus'

// Revivires del grupo (o de cada Pokémon, con `revivesEach`: la raid): se gastan solos, en el orden en que cayeron, al
// empezar el turno siguiente a la caída.

/** Revivires que tiene el grupo para toda la incursión */
export const INCURSION_REVIVES = 3
/** Fracción de los PS máximos con la que vuelve un Pokémon revivido */
export const REVIVE_HP = 0.5

/**
 * Lo levanta con esa fracción de sus PS y sin estado (también a uno que ya no volvía); `revives`, los que quedan si gastó
 * uno (los suyos, con `revivesEach`)
 */
export function raise(bf: Battlefield, f: GroupFighter, hpFraction: number, revives?: number) {
  f.hp = Math.max(1, Math.round(f.maxHp * hpFraction))
  clearStatus(f)
  f.fellAt = null
  f.out = false
  bf.log(on(f, { kind: EventKind.Revive, revives, text: `¡${f.name} vuelve a la lucha!` }))
}

/** Gasta un revivir de ese Pokémon (el suyo o uno del grupo); devuelve los que le quedan */
function spendRevive(bf: Battlefield, f: GroupFighter): number {
  if (bf.revivesEach === undefined) return --bf.revives
  const spent = (bf.revivesSpent?.[f.id] ?? 0) + 1
  bf.revivesSpent = { ...bf.revivesSpent, [f.id]: spent }
  return bf.revivesEach - spent
}

/** Cada caído del grupo vuelve si le quedan revivires; si no, se queda fuera hasta el final (y deja de sumar pasivas) */
export function resolveFallen(bf: Battlefield) {
  const fallen = bf.party.filter((f) => f.hp === 0 && !f.out)
  fallen.sort((a, b) => (a.fellAt ?? 0) - (b.fellAt ?? 0))
  for (const f of fallen) {
    if (revivesFor(bf, f) > 0) {
      raise(bf, f, REVIVE_HP, spendRevive(bf, f))
    } else {
      f.out = true
      bf.log(on(f, { kind: EventKind.Out, text: `${f.name} no puede seguir: solo le queda mirar.` }))
    }
  }
}

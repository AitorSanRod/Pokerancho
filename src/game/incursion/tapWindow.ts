import { MoveClass, moveClass } from '../../data/incursionMoves'
import type { Battlefield } from './battlefield'
import { isUp, Team, type GroupFighter } from './fighter'
import { isBot } from './party'

// Toques antes de cada turno del grupo: durante TAP_WINDOW_MS los jugadores pueden tocar la pantalla y, si llegan a los
// toques de su ataque (`tapGoal`), lo potencian ese turno con su mejora (`tapBonus`): los de daño pegan más, los de cura
// curan más y los de estado hacen que el resto del grupo pegue y cure más. La simulación se para en cada ventana hasta saber quién lo ha
// conseguido (ver incursionLeg.ts); así todos los móviles siguen viendo lo mismo.

/** Milisegundos que dura la ventana de toques antes de cada turno del grupo */
export const TAP_WINDOW_MS = 5_000
/**
 * Milisegundos tras la ventana en los que se ve si se ha potenciado el ataque, antes de empezar el turno. Es también el
 * margen para que el servidor reparta los toques de todos a los móviles
 */
export const TAP_SETTLE_MS = 1_500

/** El ataque que usará un Pokémon del grupo desde ese turno y a quién (null: el que elija solo, como siempre) */
export interface MovePick {
  moveId: string
  target: string | null
}

/**
 * Lo que se decide en una ventana, por el id de cada Pokémon: quiénes potenciaron su ataque con los toques y quiénes
 * cambiaron de ataque u objetivo (sigue así hasta que lo vuelvan a cambiar)
 */
export interface TurnOrders {
  boosted: string[]
  picks: Record<string, MovePick>
}

export const noTurnOrders = (): TurnOrders => ({ boosted: [], picks: {} })

/**
 * Las órdenes de la ventana `turn` del tramo `leg`, sabiendo que acaba a los `windowEndMs` de empezar el tramo;
 * undefined si aún no se saben (la simulación se para ahí)
 */
export type TapResolver = (leg: number, turn: number, windowEndMs: number) => TurnOrders | undefined

/** Hay ventana de toques si queda en pie algún Pokémon de un jugador (los bots no tocan) */
export const anyPlayerUp = (bf: Battlefield): boolean => bf.party.some((f) => isUp(f) && !isBot(f.id))

/**
 * Multiplicador del daño y la cura de un Pokémon del grupo este turno por los toques: la mejora de su ataque si lo
 * potenció (los de daño y de cura) más la de cada compañero con un ataque de estado potenciado (se suman)
 */
export function tapMult(bf: Battlefield, actor: GroupFighter): number {
  if (actor.team !== Team.Party) return 1
  const boosted = (f: GroupFighter) => bf.boosted.includes(f.id)
  const own = boosted(actor) && moveClass(actor.move) !== MoveClass.Status ? actor.move.tapBonus : 0
  const fromStatus = bf.party
    .filter((f) => f.id !== actor.id && boosted(f) && moveClass(f.move) === MoveClass.Status)
    .reduce((sum, f) => sum + f.move.tapBonus, 0)
  return 1 + own + fromStatus
}

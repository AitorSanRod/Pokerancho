import type { Battlefield } from './battlefield'
import { isUp } from './fighter'
import { isBot } from './party'

// Toques antes de cada turno del grupo: durante TAP_WINDOW_MS los jugadores pueden tocar la pantalla y, si llegan a
// TAP_GOAL, su Pokémon pega un poco más ese turno. La simulación se para en cada ventana hasta saber quién lo ha
// conseguido (ver incursionLeg.ts); así todos los móviles siguen viendo lo mismo.

/** Milisegundos que dura la ventana de toques antes de cada turno del grupo */
export const TAP_WINDOW_MS = 5_000
/**
 * Milisegundos tras la ventana en los que se ve si se ha potenciado el ataque, antes de empezar el turno. Es también el
 * margen para que el servidor reparta los toques de todos a los móviles
 */
export const TAP_SETTLE_MS = 1_500
/** Toques que hacen falta en la ventana para potenciar el ataque */
export const TAP_GOAL = 50
/** Daño de más del ataque potenciado ese turno (0.1 = +10%) */
export const TAP_BONUS = 0.1

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

/** Multiplicador de daño del que ataca: más si ha potenciado su ataque este turno */
export const tapMult = (bf: Battlefield, actorId: string): number => (bf.boosted.includes(actorId) ? 1 + TAP_BONUS : 1)

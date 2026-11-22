import { MoveClass, moveClass } from '../../data/incursionMoves'
import type { Battlefield } from './battlefield'
import { isUp, Team, type GroupFighter, type MemberState } from './fighter'
import { isBot } from './party'
import { isPerfect, partialGain, tapChallengeOf } from './tapChallenge'

// Toques antes de cada turno del grupo: durante TAP_WINDOW_MS los jugadores hacen el reto de su ataque (machacar o
// anillos, ver tapChallenge.ts) y lo conseguido, de 0 a 1, lo potencia ese turno: los de daño pegan más, los de cura
// curan más y los de estado hacen que el resto del grupo pegue y cure más. Con todos los anillos, más aún: crítico,
// cura crítica o la mejora del de estado por STATUS_PERFECT_MULT. La simulación se para en cada ventana hasta saber lo
// que ha conseguido cada uno (ver incursionLeg.ts); así todos los móviles siguen viendo lo mismo.

/** Milisegundos que dura la ventana de toques antes de cada turno del grupo */
export const TAP_WINDOW_MS = 5_000
/**
 * Milisegundos tras la ventana en los que se ve si se ha potenciado el ataque, antes de empezar el turno. Es también el
 * margen para que el servidor reparta los toques de todos a los móviles
 */
export const TAP_SETTLE_MS = 1_500
/** Mejora de quien llegó a los toques en las órdenes de antes de los retos (`TurnOrders.boosted`): la de entonces */
export const LEGACY_TAP_BONUS = 0.1
/** Por cuánto se multiplica la mejora que da al resto del grupo un ataque de estado con todos sus anillos acertados */
export const STATUS_PERFECT_MULT = 1.5

/** El ataque que usará un Pokémon del grupo desde ese turno y a quién (null: el que elija solo, como siempre) */
export interface MovePick {
  moveId: string
  target: string | null
}

/**
 * Lo que se decide en una ventana, por el id de cada Pokémon: lo que consiguió cada uno en el reto (`taps`, de 0 a 1;
 * sin él o sin su id, nada), quiénes
 * cambiaron de ataque u objetivo (sigue así hasta que lo vuelvan a cambiar) y quiénes acertaron el toque crítico en un
 * golpe del turno anterior: su primer golpe a un rival de este turno es crítico (×TAP_CRIT_MULT, battle/attack.ts).
 * Sin `crits` (las incursiones, que no tienen toque crítico), ninguno. `joins`: Pokémon de jugadores que entran en
 * plena pelea, cada uno en el sitio del último bot que quede (ver joins.ts; solo en la raid)
 */
export interface TurnOrders {
  taps?: Record<string, number>
  /**
   * Solo en las órdenes guardadas antes de los retos (incursiones y raids que ya iban en marcha al actualizar): quiénes
   * llegaron a los toques. Valen LEGACY_TAP_BONUS, como entonces, para que lo jugado se repita igual en el móvil y en
   * el servidor
   */
  boosted?: string[]
  picks: Record<string, MovePick>
  crits?: string[]
  joins?: MemberState[]
}

export const noTurnOrders = (): TurnOrders => ({ picks: {} })

/**
 * Las órdenes de la ventana `turn` del tramo `leg`, sabiendo que acaba a los `windowEndMs` de empezar el tramo;
 * undefined si aún no se saben (la simulación se para ahí)
 */
export type TapResolver = (leg: number, turn: number, windowEndMs: number) => TurnOrders | undefined

/** Hay ventana de toques si queda en pie algún Pokémon de un jugador (los bots no tocan) */
export const anyPlayerUp = (bf: Battlefield): boolean => bf.party.some((f) => isUp(f) && !isBot(f.id))

const scoreOf = (bf: Battlefield, f: GroupFighter): number => bf.taps[f.id] ?? 0
const legacyBoosted = (bf: Battlefield, f: GroupFighter): boolean => bf.boosted.includes(f.id)

/** Si acertó todos los anillos de su ataque este turno */
export const tapPerfect = (bf: Battlefield, f: GroupFighter): boolean => f.team === Team.Party && isPerfect(tapChallengeOf(f.move), scoreOf(bf, f))

/** Lo que da al resto del grupo un Pokémon con un ataque de estado por lo conseguido en el reto */
function supportGain(bf: Battlefield, f: GroupFighter): number {
  if (legacyBoosted(bf, f)) return LEGACY_TAP_BONUS
  const ch = tapChallengeOf(f.move)
  return tapPerfect(bf, f) ? ch.bonus * STATUS_PERFECT_MULT : partialGain(ch, scoreOf(bf, f))
}

/**
 * Multiplicador del daño y la cura de un Pokémon del grupo este turno por los toques: lo que mejora su ataque por lo
 * conseguido (los de daño y de cura; acertar todos los anillos va aparte, como crítico) más lo que le da cada
 * compañero con un ataque de estado (se suman)
 */
export function tapMult(bf: Battlefield, actor: GroupFighter): number {
  if (actor.team !== Team.Party) return 1
  const own = moveClass(actor.move) === MoveClass.Status ? 0 : legacyBoosted(bf, actor) ? LEGACY_TAP_BONUS : partialGain(tapChallengeOf(actor.move), scoreOf(bf, actor))
  const fromStatus = bf.party
    .filter((f) => f.id !== actor.id && moveClass(f.move) === MoveClass.Status)
    .reduce((sum, f) => sum + supportGain(bf, f), 0)
  return 1 + own + fromStatus
}

/** Los del grupo con un ataque de daño y todos sus anillos acertados: su primer golpe a un rival del turno es crítico */
export const perfectStrikers = (bf: Battlefield): string[] =>
  bf.party.filter((f) => moveClass(f.move) === MoveClass.Damage && tapPerfect(bf, f)).map((f) => f.id)

/** Las puntuaciones del reto sin la de ese Pokémon (cambió de ataque en plena ventana: su reto empieza de cero) */
export function withoutTap(scores: Record<string, number>, id: string): Record<string, number> {
  const { [id]: _dropped, ...rest } = scores
  return rest
}

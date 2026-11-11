import type { Incursion } from '../../data/incursions'
import { incursionMove, type IncursionMove } from '../../data/incursionMoves'
import { EffectKind, effectOf, hitsAllies, MoveClass, moveClass } from '../../data/incursionMoves'
import { randInt, type Rng } from '../core/random'
import { foeLevels } from './entry'
import type { MemberState } from './fighter'
import { repertoire } from './repertoire'

// El grupo de una incursión: los jugadores que entran y, si no llegan a cinco, bots que cubren lo que le falta.

/** Pokémon que forman un grupo de incursión */
export const PARTY_SIZE = 5
/** Niveles por debajo del Pokémon más alto del grupo con los que llega un bot */
export const BOT_LEVEL_GAP = 5
/** Variación al azar del nivel de cada bot: hasta este número de niveles menos */
export const BOT_LEVEL_SPREAD = 2

const BOT_PREFIX = 'bot-'

/** Si ese Pokémon del grupo es de un bot */
export const isBot = (id: string): boolean => id.startsWith(BOT_PREFIX)

/** Un Pokémon entra en la incursión con todos sus PS y sin estado */
export const freshMember = (m: Pick<MemberState, 'id' | 'speciesId' | 'level' | 'stars' | 'nature' | 'moveId'>): MemberState => ({
  ...m,
  hpFraction: 1,
  status: null,
  heldTurns: 0,
  out: false,
})

/**
 * El movimiento de un bot: cura si nadie cura, provoca si nadie provoca; si no, su golpe más fuerte. Los que dan también
 * a su grupo (como Terremoto), solo si no tiene otro de daño
 */
export function botMove(speciesId: number, level: number, taken: IncursionMove[]): string {
  const moves = repertoire(speciesId, level)
  for (const role of [heals, taunts]) {
    const fit = moves.find(role)
    if (fit && !taken.some(role)) return fit.id
  }
  return moves.reduce((a, b) => (power(b) > power(a) ? b : a)).id
}

const heals = (mv: IncursionMove) => moveClass(mv) === MoveClass.Heal
const taunts = (mv: IncursionMove) => !!effectOf(mv, EffectKind.Taunt)
const power = (mv: IncursionMove) => (moveClass(mv) !== MoveClass.Damage ? 0 : hitsAllies(mv) ? 1 : mv.power)

/**
 * Nivel de un bot: el del Pokémon más alto del grupo menos BOT_LEVEL_GAP (y hasta BOT_LEVEL_SPREAD menos, al azar), sin
 * bajar del mínimo de entrada ni pasar del rival más alto de la incursión (ni de su máximo de entrada)
 */
export function botLevel(inc: Incursion, members: MemberState[], rng: Rng): number {
  const top = Math.max(inc.minLevel, ...members.map((m) => m.level))
  const cap = Math.min(inc.maxLevel, foeLevels(inc)[1])
  const level = top - BOT_LEVEL_GAP - randInt(0, BOT_LEVEL_SPREAD, rng)
  return Math.max(inc.minLevel, Math.min(cap, level))
}

/** La especie de un bot: si nadie cura, una que pueda curar; si nadie provoca, una que pueda provocar; si no, al azar */
function botSpecies(inc: Incursion, level: number, taken: IncursionMove[], rng: Rng): number {
  for (const role of [heals, taunts]) {
    if (taken.some(role)) continue
    const fits = inc.bots.filter((sp) => repertoire(sp, level).some(role))
    if (fits.length) return fits[randInt(0, fits.length - 1, rng)]
  }
  return inc.bots[randInt(0, inc.bots.length - 1, rng)]
}

/** Completa el grupo con bots hasta cinco; cada bot se elige viendo lo que ya hay */
export function fillWithBots(inc: Incursion, members: MemberState[], rng: Rng): MemberState[] {
  const party = [...members]
  for (let i = 0; party.length < PARTY_SIZE; i++) {
    const taken = party.map((m) => incursionMove(m.moveId))
    const level = botLevel(inc, members, rng)
    const speciesId = botSpecies(inc, level, taken, rng)
    party.push(freshMember({ id: `${BOT_PREFIX}${i}`, speciesId, level, stars: 0, moveId: botMove(speciesId, level, taken) }))
  }
  return party
}

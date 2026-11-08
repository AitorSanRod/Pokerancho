import type { Incursion } from '../../data/incursions'
import { battleMove, type BattleMove } from '../../data/learnsets'
import { MoveKind } from '../../data/supportMoves'
import { randInt, type Rng } from '../core/random'
import type { MemberState } from './fighter'
import { repertoire } from './repertoire'

// El grupo de una incursión: los jugadores que entran y, si no llegan a cinco, bots que cubren lo que le falta.

/** Pokémon que forman un grupo de incursión */
export const PARTY_SIZE = 5
/** Niveles por encima del mínimo de la incursión con los que puede llegar un bot (de 0 a este número, sin pasar del máximo) */
export const BOT_LEVEL_SPREAD = 4

const BOT_PREFIX = 'bot-'

/** Si ese Pokémon del grupo es de un bot */
export const isBot = (id: string): boolean => id.startsWith(BOT_PREFIX)

/** Un Pokémon entra en la incursión con todos sus PS y sin estado */
export const freshMember = (m: Pick<MemberState, 'id' | 'speciesId' | 'level' | 'stars' | 'moveId'>): MemberState => ({
  ...m,
  hpFraction: 1,
  status: null,
  frozenTurns: 0,
  out: false,
})

/** El movimiento de un bot: cura si nadie cura, provoca si nadie provoca; si no, su golpe más fuerte */
export function botMove(speciesId: number, level: number, taken: BattleMove[]): string {
  const moves = repertoire(speciesId, level)
  for (const role of [MoveKind.Heal, MoveKind.Taunt]) {
    const fit = moves.find((mv) => mv.kind === role)
    if (fit && !taken.some((mv) => mv.kind === role)) return fit.id
  }
  return moves.reduce((a, b) => (power(b) > power(a) ? b : a)).id
}

const power = (mv: BattleMove) => (mv.kind === MoveKind.Damage ? mv.power : 0)

/** Completa el grupo con bots hasta cinco; cada bot elige su movimiento viendo los que ya hay */
export function fillWithBots(inc: Incursion, members: MemberState[], rng: Rng): MemberState[] {
  const party = [...members]
  for (let i = 0; party.length < PARTY_SIZE; i++) {
    const speciesId = inc.bots[randInt(0, inc.bots.length - 1, rng)]
    const level = randInt(inc.minLevel, Math.min(inc.maxLevel, inc.minLevel + BOT_LEVEL_SPREAD), rng)
    const moveId = botMove(speciesId, level, party.map((m) => battleMove(m.moveId)))
    party.push(freshMember({ id: `${BOT_PREFIX}${i}`, speciesId, level, stars: 0, moveId }))
  }
  return party
}

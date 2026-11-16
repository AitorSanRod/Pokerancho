import { COMBAT_LADDERS, COMBAT_MOVESETS, COMBAT_SPECIES_MOVES, combatMove } from '../../data/combatMoves'
import { moveClass, MoveClass, type IncursionMove } from '../../data/incursionMoves'
import type { LearnedMove } from '../../data/learnsets'
import { Rarity, rarityOf, species } from '../../data/species'
import { TM_IDS } from '../../data/tms'
import type { OwnedMon } from '../core/state'
import { tmFits } from '../incursion/tms'
import { MAX_LEVEL } from '../team/stats'

// Los ataques de combate de un Pokémon del jugador (rutas, torre y raids; las incursiones usan su repertorio aparte, ver
// incursion/repertoire.ts): la escalera de cada uno de sus tipos hasta su nivel y su rareza, los propios de su especie y
// los de daño aprendidos con MTs. No olvida ninguno al subir de nivel: elige cuál lleva. Todos con los ajustes de combate.

const RARITY_ORDER = Object.values(Rarity)

type Mon = Pick<OwnedMon, 'speciesId' | 'level' | 'tmMoves'>

const reaches = (rarity: Rarity, min: Rarity | undefined) => !min || RARITY_ORDER.indexOf(rarity) >= RARITY_ORDER.indexOf(min)

/** Lo que aprende una especie en combate, cada uno con su nivel (sin repetir), por orden de nivel */
function learnset(speciesId: number): LearnedMove[] {
  const custom = COMBAT_MOVESETS[speciesId]
  if (custom) return [...custom].sort((a, b) => a.level - b.level)
  const sp = species(speciesId)
  const rarity = rarityOf(sp)
  const steps = sp.types.flatMap((t) => COMBAT_LADDERS[t].filter((step) => reaches(rarity, step.minRarity)))
  const all = [...steps, ...(COMBAT_SPECIES_MOVES[speciesId] ?? [])].sort((a, b) => a.level - b.level)
  return all.filter((m, i) => all.findIndex((other) => other.move.id === m.move.id) === i)
}

/** Lo que sabe en combate una especie a ese nivel, con los ajustes de combate */
export const combatRepertoire = (speciesId: number, level: number): IncursionMove[] =>
  learnset(speciesId).filter((m) => level >= m.level).map((m) => combatMove(m.move.id))

const isStrike = (id: string) => moveClass(combatMove(id)) === MoveClass.Damage

/** Lo que puede llevar a un combate un Pokémon del jugador: su repertorio de combate y los de daño de sus MTs */
export function combatMoveChoices(mon: Mon): IncursionMove[] {
  const own = combatRepertoire(mon.speciesId, mon.level)
  const taught = mon.tmMoves.filter((id) => isStrike(id) && !own.some((mv) => mv.id === id)).map(combatMove)
  return [...own, ...taught]
}

/** Ataques que lleva como mucho en las rutas y la torre */
export const ROUTE_MOVE_SLOTS = 2

/** Los puestos a mano de su especie (COMBAT_MOVESETS o COMBAT_SPECIES_MOVES) */
const overridesOf = (speciesId: number): string[] =>
  (COMBAT_MOVESETS[speciesId] ?? COMBAT_SPECIES_MOVES[speciesId] ?? []).map((m) => m.move.id)

/**
 * Los que lleva a las rutas y la torre: como mucho ROUTE_MOVE_SLOTS de los que sabe. Primero los puestos a mano para su
 * especie, luego los de sus MTs y luego los de su escalera; en cada grupo, el aprendido más tarde (el más fuerte) antes
 */
export function routeMoveChoices(mon: Mon): IncursionMove[] {
  const overrides = overridesOf(mon.speciesId)
  const levelOf = new Map(learnset(mon.speciesId).map((m) => [m.move.id, m.level]))
  const rank = (mv: IncursionMove) => (overrides.includes(mv.id) ? 0 : levelOf.has(mv.id) ? 2 : 1)
  const later = (mv: IncursionMove) => -(levelOf.get(mv.id) ?? 0)
  return [...combatMoveChoices(mon)].sort((a, b) => rank(a) - rank(b) || later(a) - later(b)).slice(0, ROUTE_MOVE_SLOTS)
}

export const knowsCombatMove =(mon: Mon, moveId: string): boolean => combatMoveChoices(mon).some((mv) => mv.id === moveId)

/**
 * Si un Pokémon de esa especie y nivel puede llevar ese ataque a un combate: de su repertorio o de una MT de daño que
 * pueda aprender. Para el servidor, que no ve las MTs aprendidas (como con su nivel, se fía de la partida)
 */
export const mayKnowCombatMove = (speciesId: number, level: number, moveId: string): boolean =>
  combatRepertoire(speciesId, level).some((mv) => mv.id === moveId) ||
  TM_IDS.some((tm) => tm === moveId && tmFits(speciesId, tm) && isStrike(tm))

/** Un ataque de combate de una especie y el nivel desde el que lo sabe */
export interface CombatLearnStep {
  move: IncursionMove
  from: number
}

/** Todo lo que aprende una especie en combate hasta el nivel máximo, por orden de nivel */
export const combatLearnTimeline = (speciesId: number): CombatLearnStep[] =>
  learnset(speciesId)
    .filter((m) => m.level <= MAX_LEVEL)
    .map((m) => ({ move: combatMove(m.move.id), from: m.level }))

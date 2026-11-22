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

type Mon = Pick<OwnedMon, 'speciesId' | 'level' | 'tmMoves'> & Partial<Pick<OwnedMon, 'routeMoves'>>

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

/** Ataques que lleva como mucho en las rutas, la torre y la pelea de la pestaña Raids */
export const ROUTE_MOVE_SLOTS = 2

/** Los puestos a mano de su especie (COMBAT_MOVESETS o COMBAT_SPECIES_MOVES) */
const overridesOf = (speciesId: number): string[] =>
  (COMBAT_MOVESETS[speciesId] ?? COMBAT_SPECIES_MOVES[speciesId] ?? []).map((m) => m.move.id)

/** El más potente antes; a igual potencia, el más preciso */
const byPower = (a: IncursionMove, b: IncursionMove) => b.power - a.power || b.accuracy - a.accuracy

/** Los que puede elegir en la ficha para las rutas, la torre y las raids: todos los de daño que sabe */
export const routeMovePool = (mon: Mon): IncursionMove[] => combatMoveChoices(mon).filter((mv) => isStrike(mv.id))

/**
 * Los que elige el juego si no los ha elegido a mano: como mucho ROUTE_MOVE_SLOTS de daño. Primero los puestos a mano
 * para su especie; luego, con dos tipos, el más potente de cada uno; y si queda sitio, los más potentes del resto
 */
export function autoRouteMoves(mon: Mon): IncursionMove[] {
  const overrides = overridesOf(mon.speciesId)
  const known = [...routeMovePool(mon)].sort(byPower)
  const own = known.filter((mv) => overrides.includes(mv.id))
  const types = species(mon.speciesId).types
  const bestOfType = types.length > 1 ? types.map((t) => known.find((mv) => mv.type === t && !own.includes(mv))) : []
  const picks = [...own, ...bestOfType.filter((mv) => mv !== undefined), ...known]
  return picks.filter((mv, i) => picks.indexOf(mv) === i).slice(0, ROUTE_MOVE_SLOTS)
}

/** Los que lleva a las rutas, la torre y las raids: los elegidos en la ficha (los que aún sabe) o, sin elegir, los del juego */
export function routeMoveChoices(mon: Mon): IncursionMove[] {
  if (!mon.routeMoves) return autoRouteMoves(mon)
  const pool = routeMovePool(mon)
  return mon.routeMoves.flatMap((id) => pool.filter((mv) => mv.id === id)).slice(0, ROUTE_MOVE_SLOTS)
}

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

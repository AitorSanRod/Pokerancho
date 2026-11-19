import { preEvolutionsOf } from '../../data/evolutions'
import { GYMS } from '../../data/gyms'
import { findRoute, NodeKind, onlyTrainerFights, pathSpecies, starLevel, starSeeAll, StarGoal, type Route, type RouteNode, type StarGoalSpec } from '../../data/maps'
import type { PassiveRef } from '../../data/passives'
import { baseSpeciesOf, species } from '../../data/species'
import { TRAINERS } from '../../data/trainers'
import type { BattleRecord } from '../battle/battle'
import { activeMon, type GameState, type OwnedMon, type Run } from '../core/state'
import { ranchPassives } from '../team/ranchPassives'
import { maxHp } from '../team/stats'

// Estrellas de una ruta: tres objetivos que se miran al completarla. La primera es completarla; las otras dos se eligen
// a mano en cada ruta (`stars` en kantoMaps.ts). Cada una da su premio la primera vez que se cumple (aparte del premio
// de la ruta, que es de la primera vez que se completa): quien ya la había completado tiene que volver a pasarla.
// La ruta en curso avisa de las que ya no se pueden conseguir en ella (`brokenStars`). Sin ellas: salir sin pasar del nivel de su rival más fuerte y descubrir todas sus especies (en las rutas de
// solo entrenadores o líderes, salir con unos niveles menos).

export { StarGoal } from '../../data/maps'

/** Una estrella con lo que pide resuelto (el nivel de `LevelCap`, siempre puesto) y la clave que se guarda al conseguirla */
export type RouteStar = StarGoalSpec & { key: string }

/** Niveles por debajo del rival más fuerte para la tercera estrella de una ruta de solo entrenadores o líderes, sin `stars` */
export const TRAINER_ROUTE_STAR_GAP = 3
/** Tickets de gacha por cada estrella nueva */
export const STAR_TICKETS = 2
/** Fracción del dinero del premio de la ruta que da cada estrella nueva */
export const STAR_MONEY_SHARE = 0.5

const teamTop = (team: { level: number }[]): number => Math.max(0, ...team.map((m) => m.level))

function rivalLevel(r: Route, n: RouteNode): number {
  if (n.boss) return n.boss.level
  if (n.gym) return teamTop(GYMS[n.gym].team)
  if (n.trainer) return teamTop(TRAINERS[n.trainer].team)
  return n.kind === NodeKind.Wild ? r.levels[1] + (n.levelBonus ?? 0) : 0
}

/** Nivel del rival más fuerte de la ruta, por cualquiera de sus caminos */
export const strongestRivalLevel = (r: Route): number => Math.max(...r.nodes.map((n) => rivalLevel(r, n)))

/** Todas las especies que pueden salir en la ruta, por cualquiera de sus caminos */
export const routeSpecies = (r: Route): number[] => pathSpecies(r, r.nodes.map((n) => n.id))

/** Lo que se guarda al conseguirla: distinto para cada objetivo y su dato */
function starKey(spec: StarGoalSpec): string {
  switch (spec.goal) {
    case StarGoal.LevelCap:
      return `level-${spec.level}`
    case StarGoal.WithSpecies:
      return `species-${spec.speciesId}`
    case StarGoal.MonType:
      return `type-${spec.type}`
    case StarGoal.OnlyPassiveTypes:
      return `passives-${[...spec.types].sort().join('+')}`
    case StarGoal.MinHp:
      return `hp-${spec.percent}`
    default:
      return spec.goal
  }
}

/** Las dos estrellas elegidas de la ruta, o las de por defecto */
function chosenGoals(r: Route): StarGoalSpec[] {
  if (r.stars) return r.stars
  const top = strongestRivalLevel(r)
  return [starLevel(top), onlyTrainerFights(r) ? starLevel(top - TRAINER_ROUTE_STAR_GAP) : starSeeAll()]
}

function resolve(r: Route, spec: StarGoalSpec): RouteStar {
  const full = spec.goal === StarGoal.LevelCap ? { ...spec, level: spec.level ?? strongestRivalLevel(r) } : spec
  return { ...full, key: starKey(full) }
}

/** Las tres estrellas de la ruta, en orden */
export const routeStars = (r: Route): RouteStar[] => [{ goal: StarGoal.Complete }, ...chosenGoals(r)].map((spec) => resolve(r, spec))

export const hasStar = (s: GameState, r: Route, star: RouteStar): boolean => (s.routeStars[r.id] ?? []).includes(star.key)

export const starCount = (s: GameState, r: Route): number => routeStars(r).filter((star) => hasStar(s, r, star)).length

/** Especies de la ruta que aún no están en la Pokédex */
export const unseenRouteSpecies = (s: GameState, r: Route): number[] => routeSpecies(r).filter((id) => !s.seen.includes(id))

/** PS del Pokémon en % de sus PS máximos */
export const hpPercent = (mon: OwnedMon): number => (100 * mon.hp) / maxHp(mon)

/** Al empezar un combate: apunta los tipos de las pasivas de rancho con las que lucha */
export function notePassives(run: Run, passives: PassiveRef[]) {
  for (const { type } of passives) if (!run.passiveTypes.includes(type)) run.passiveTypes.push(type)
}

/** Al acabar un combate: apunta los PS más bajos a los que ha llegado en él */
export function noteLowestHp(run: Run, record: BattleRecord) {
  for (const e of record.events) run.lowestHp = Math.min(run.lowestHp, (100 * e.playerHp) / record.player.maxHp)
}

/** Si `speciesId` es la especie pedida o una de sus evoluciones (las formas cuentan como su especie) */
function inLine(speciesId: number, wanted: number): boolean {
  const own = baseSpeciesOf(speciesId)
  return own === wanted || preEvolutionsOf(own).includes(wanted)
}

/**
 * Si la ruta en curso ya no puede conseguir la estrella: lo que se mira al salir (nivel, especie, tipo) o lo que ya ha
 * pasado en ella (una pasiva que no vale, bajar de los PS). Las de completarla y descubrirlas todas nunca se pierden
 */
function starLost(s: GameState, star: RouteStar, run: Run): boolean {
  switch (star.goal) {
    case StarGoal.OnlyPassiveTypes:
      return run.passiveTypes.some((t) => !star.types.includes(t))
    case StarGoal.SeeAll:
    case StarGoal.Complete:
      return false
    default:
      return !starMet(s, null, star, run)
  }
}

/** Estrellas aún sin conseguir que la ruta en curso ya no puede conseguir: para avisar al jugador en cuanto las pierde */
export function brokenStars(s: GameState): RouteStar[] {
  const run = s.run
  if (!run || run.phase === 'fainted') return []
  const r = findRoute(run.routeId)
  return r ? routeStars(r).filter((star) => !hasStar(s, r, star) && starLost(s, star, run)) : []
}

/** Si la ruta recién completada cumple la estrella (sin ruta, solo lo que no depende de ella) */
function starMet(s: GameState, r: Route | null, star: RouteStar, run: Run): boolean {
  const mon = activeMon(s)!
  switch (star.goal) {
    case StarGoal.LevelCap:
      return run.startLevel <= star.level!
    case StarGoal.SeeAll:
      return r !== null && unseenRouteSpecies(s, r).length === 0
    case StarGoal.WithSpecies:
      return inLine(mon.speciesId, star.speciesId)
    case StarGoal.MonType:
      return species(mon.speciesId).types.includes(star.type)
    case StarGoal.NoRanchPassives:
      return run.passiveTypes.length === 0
    case StarGoal.OnlyPassiveTypes:
      return run.passiveTypes.length > 0 && run.passiveTypes.every((t) => star.types.includes(t))
    case StarGoal.MinHp:
      return run.lowestHp >= star.percent
    case StarGoal.Complete:
      return true
  }
}

/**
 * Si el Pokémon activo cumpliría ahora lo que pide la estrella al salir (nivel, especie, tipo y pasivas de su rancho);
 * null en las que solo se saben al acabar la ruta
 */
export function meetsNow(s: GameState, star: RouteStar): boolean | null {
  const mon = activeMon(s)
  if (!mon) return null
  const types = mon.ranch === null ? [] : ranchPassives(s, mon.ranch).map((p) => p.type)
  switch (star.goal) {
    case StarGoal.LevelCap:
      return mon.level <= star.level!
    case StarGoal.WithSpecies:
      return inLine(mon.speciesId, star.speciesId)
    case StarGoal.MonType:
      return species(mon.speciesId).types.includes(star.type)
    case StarGoal.NoRanchPassives:
      return types.length === 0
    case StarGoal.OnlyPassiveTypes:
      return types.length > 0 && types.every((t) => star.types.includes(t))
    default:
      return null
  }
}

/** Premio de una estrella nueva */
export const starPrize = (r: Route) => ({ tickets: STAR_TICKETS, money: Math.round(r.reward.money * STAR_MONEY_SHARE) })

/** Al completar la ruta: apunta las estrellas que se cumplen por primera vez, paga su premio y las deja en lo ganado en la ruta */
export function claimRouteStars(s: GameState, r: Route) {
  const run = s.run!
  for (const star of routeStars(r)) {
    if (hasStar(s, r, star) || !starMet(s, r, star, run)) continue
    s.routeStars[r.id] = [...(s.routeStars[r.id] ?? []), star.key]
    const prize = starPrize(r)
    s.tickets += prize.tickets
    s.money += prize.money
    run.earned.tickets += prize.tickets
    run.earned.money += prize.money
    run.earned.stars.push(star.key)
  }
}

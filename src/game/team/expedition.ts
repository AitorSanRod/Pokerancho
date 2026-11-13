import { averageLegSteps, route, wildSpecies, type Route } from '../../data/maps'
import { species } from '../../data/species'
import { expReward, moneyReward, pieceReward, ticketReward } from '../battle/rewards'
import { isSeen } from '../collection/dex'
import { MissionKind } from '../../data/dailyMissions'
import { advanceMission } from '../collection/missions'
import { addPieces } from '../collection/pieces'
import { pickEncounter, randInt, type Rng } from '../core/random'
import { findMon, MonPlace, monPlace, type Expedition, type GameState, type OwnedMon } from '../core/state'
import { gainExp, type LevelUpResult } from './stats'
import { upgradeLevel } from './upgrades'
import { ExpeditionFocus, focusMult, isExpeditionFocus } from './expeditionFocus'

/** Duraciones que se pueden elegir, en minutos de juego */
export const EXPEDITION_DURATIONS = [15, 60, 240, 480]
/** Multiplicador de EXP y ₽ de cada victoria según la duración en minutos (las más largas ya tienen más combates) */
const DURATION_REWARD_MULT: Record<number, number> = { 15: 1, 60: 2.5, 240: 3, 480: 3 }
/** Pokémon que pueden estar de expedición a la vez sin mejoras (cada mejora de la tienda suma 1) */
const BASE_EXPEDITION_SLOTS = 1
/** Combates por hora de expedición (en una ruta normal se libran unos 15) */
const BATTLES_PER_HOUR = 8
/** Probabilidad mínima de ganar cada combate, aunque el Pokémon sea muy débil para la ruta */
const MIN_WIN_RATE = 0.2

interface ExpeditionResult extends LevelUpResult {
  battles: number
  wins: number
  exp: number
  money: number
  tickets: number
  /** Especies de las piezas soltadas (una entrada por pieza) */
  pieces: number[]
}

export const expeditionSlots = (s: GameState): number => BASE_EXPEDITION_SLOTS + upgradeLevel(s, 'expeditionSlots')

/** Por qué no se puede mandar a nadie más de expedición (sin huecos o sin nadie en el rancho), o null si se puede */
export function expeditionsBlocker(s: GameState): string | null {
  if (s.expeditions.length >= expeditionSlots(s)) return 'No quedan huecos de expedición. Amplíalos en la Tienda.'
  if (!s.owned.some((m) => monPlace(s, m.uid) === MonPlace.Ranch)) return 'No queda ningún Pokémon en el rancho.'
  return null
}

export function expeditionBlocker(s: GameState, uid: string): string | null {
  const mon = findMon(s, uid)
  if (!mon) return 'Ese Pokémon no existe.'
  const place = monPlace(s, uid)
  if (place === 'run') return 'Está explorando una ruta.'
  if (place === MonPlace.Expedition) return 'Ya está de expedición.'
  if (place === MonPlace.Incursion) return 'Está en una incursión.'
  if (place === MonPlace.Tower) return 'Está en la torre.'
  if (place === MonPlace.Raid) return 'Está luchando contra el jefe.'
  if (place === MonPlace.Box) return 'Está guardado en la Caja.'
  const general = expeditionsBlocker(s)
  if (general) return general
  if (mon.hp < 1) return `${species(mon.speciesId).name} está debilitado.`
  return null
}

/** Por qué no se puede mandar a nadie a esa ruta (solo a las completadas y con sus salvajes vistos), o null si se puede */
export function expeditionRouteBlocker(s: GameState, routeId: string): string | null {
  if (!s.completedRoutes.includes(routeId)) return 'Complétala primero para mandar expediciones a ella.'
  const missing = wildSpecies(route(routeId)).filter((id) => !isSeen(s, id)).length
  if (missing === 0) return null
  return missing === 1 ? 'Falta 1 Pokémon por descubrir en ella.' : `Faltan ${missing} Pokémon por descubrir en ella.`
}

/** Al cargar la partida: quita, sin premio, las expediciones a rutas a las que ya no se puede mandar (de antes de la regla) */
export function cancelBlockedExpeditions(s: GameState) {
  s.expeditions = s.expeditions.filter((e) => !expeditionRouteBlocker(s, e.routeId))
}

/** Manda al Pokémon de expedición, con lo que se quiere sacar de ella (`focus`) */
export function sendExpedition(s: GameState, uid: string, routeId: string, durationMin: number, focus: ExpeditionFocus) {
  if (expeditionBlocker(s, uid) || expeditionRouteBlocker(s, routeId)) return
  if (!EXPEDITION_DURATIONS.includes(durationMin) || !isExpeditionFocus(focus)) return
  s.expeditions.push({ uid, routeId, durationMin, focus, elapsedMin: 0 })
}

export function advanceExpeditions(s: GameState, minutes: number) {
  for (const e of s.expeditions) e.elapsedMin = Math.min(e.durationMin, e.elapsedMin + minutes)
}

export const isExpeditionDone = (e: Expedition): boolean => e.elapsedMin >= e.durationMin

/** Hace volver al Pokémon antes de tiempo, sin ningún premio; una expedición que ya ha vuelto se recoge, no se cancela */
export function cancelExpedition(s: GameState, uid: string): boolean {
  const e = s.expeditions.find((x) => x.uid === uid)
  if (!e || isExpeditionDone(e)) return false
  s.expeditions = s.expeditions.filter((x) => x !== e)
  return true
}

export const expeditionBattles = (durationMin: number): number =>
  Math.max(1, Math.round((durationMin / 60) * BATTLES_PER_HOUR))

export const expeditionRewardMult = (durationMin: number): number => DURATION_REWARD_MULT[durationMin]

/**
 * `amount × mult` en unidades enteras: la parte decimal se convierte en una unidad más con esa probabilidad (×1,5: 1 o
 * 2, de media 1,5)
 */
export function scaleCount(amount: number, mult: number, rng: Rng): number {
  const scaled = amount * mult
  const whole = Math.floor(scaled)
  return scaled > whole && rng() < scaled - whole ? whole + 1 : whole
}

/** Probabilidad de ganar cada combate: crece con el nivel del Pokémon frente al nivel medio de la ruta */
export function expeditionWinRate(mon: OwnedMon, r: Route): number {
  const routeLevel = (r.levels[0] + r.levels[1]) / 2
  return Math.min(1, Math.max(MIN_WIN_RATE, mon.level / routeLevel))
}

/**
 * Recoge una expedición terminada: simula sus combates de forma resumida y entrega el premio según su enfoque (EXP y ₽,
 * también según la duración). La EXP sale de las victorias, como en las rutas (sin EXP de rivales muy inferiores al Pokémon).
 */
export function collectExpedition(s: GameState, uid: string, rng: Rng = Math.random): ExpeditionResult | null {
  const e = s.expeditions.find((x) => x.uid === uid)
  const mon = findMon(s, uid)
  if (!e || !mon || !isExpeditionDone(e)) return null
  const r = route(e.routeId)
  const winRate = expeditionWinRate(mon, r)
  const mult = expeditionRewardMult(e.durationMin)
  const expMult = mult * focusMult(e.focus, ExpeditionFocus.Exp)
  const moneyMult = mult * focusMult(e.focus, ExpeditionFocus.Money)
  const lootMult = focusMult(e.focus, ExpeditionFocus.Loot)
  const result = {
    battles: expeditionBattles(e.durationMin),
    wins: 0,
    exp: 0,
    money: 0,
    tickets: 0,
    pieces: [] as number[],
  }

  for (let i = 0; i < result.battles; i++) {
    const enemyId = pickEncounter(r.encounters, rng)
    const level = randInt(r.levels[0], r.levels[1], rng)
    if (rng() >= winRate) continue
    result.wins++
    result.exp += Math.round(expReward(level, mon.level) * expMult)
    result.money += Math.round(moneyReward(level, averageLegSteps(r), rng) * moneyMult)
    result.tickets += scaleCount(ticketReward(enemyId, rng), lootMult, rng)
    if (pieceReward(enemyId, rng)) result.pieces.push(...Array<number>(scaleCount(1, lootMult, rng)).fill(enemyId))
  }

  s.expeditions = s.expeditions.filter((x) => x !== e)
  advanceMission(s, MissionKind.FinishExpeditions)
  s.money += result.money
  s.tickets += result.tickets
  for (const id of result.pieces) addPieces(s, id, 1)
  return { ...result, ...gainExp(mon, result.exp) }
}

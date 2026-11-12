import { randInt, type Rng } from '../core/random'
import { findMon, MonPlace, monPlace, type GameState, type RanchSpot } from '../core/state'
import { upgradeLevel } from './upgrades'

/** Espacios con los que empieza cada rancho; cada Pokémon ocupa uno, sea cual sea su rareza */
export const RANCH_SLOTS = 10
/** Pokémon que caben en la Caja, uno por sitio sea cual sea su rareza */
export const BOX_SLOTS = 8

/** Ranchos que tiene el jugador: el primero más los comprados en la tienda */
export const ranchCount = (s: GameState): number => 1 + upgradeLevel(s, 'ranches')

/** Espacios que tiene el rancho: los de partida más los de sus ampliaciones (ver ranchExpansion.ts) */
export const ranchCapacity = (s: GameState, ranch: number): number => RANCH_SLOTS + (s.ranchExtraSlots[ranch] ?? 0)

/** Espacios ocupados de un rancho, contando a los suyos que están en ruta o de expedición */
export const usedSlots = (s: GameState, ranch: number): number =>
  s.owned.filter((m) => m.ranch === ranch).length

/** Si cabe un Pokémon más en el rancho */
export const fitsInRanch = (s: GameState, ranch: number): boolean => usedSlots(s, ranch) < ranchCapacity(s, ranch)

/** El primer rancho con hueco, o null si no cabe en ninguno */
export function ranchWithRoom(s: GameState): number | null {
  for (let ranch = 0; ranch < ranchCount(s); ranch++) if (fitsInRanch(s, ranch)) return ranch
  return null
}

export const boxedMons = (s: GameState) => s.owned.filter((m) => m.ranch === null)

/** Destino de un traslado: el índice de un rancho o null para la Caja */
export type MonDestination = number | null

/** Pokémon del rancho que pueden sustituir al activo si este se guarda en la Caja */
const activeCandidates = (s: GameState, uid: string) =>
  s.owned.filter((m) => m.uid !== uid && monPlace(s, m.uid) === MonPlace.Ranch)

/** Por qué no se puede llevar el Pokémon a ese destino (null si se puede) */
export function moveBlocker(s: GameState, uid: string, to: MonDestination): string | null {
  const mon = findMon(s, uid)
  if (!mon) return 'Ese Pokémon no existe.'
  const place = monPlace(s, uid)
  if (place === MonPlace.Run || place === MonPlace.Expedition || place === MonPlace.Raid || place === MonPlace.Incursion || place === MonPlace.Tower) return 'Está fuera del rancho.'
  if (mon.ranch === to) return to === null ? 'Ya está en la Caja.' : 'Ya está en ese rancho.'
  if (to === null) {
    if (boxedMons(s).length >= BOX_SLOTS) return 'La Caja está llena.'
    if (uid === s.activeUid && !activeCandidates(s, uid).length) return 'Es tu único Pokémon fuera de la Caja.'
    return null
  }
  if (to < 0 || to >= ranchCount(s)) return 'Ese rancho no es tuyo.'
  return fitsInRanch(s, to) ? null : 'No cabe en ese rancho.'
}

/** Lleva el Pokémon a otro rancho o a la Caja; si era el activo, pasa a serlo uno del rancho al azar */
export function moveMon(s: GameState, uid: string, to: MonDestination, rng: Rng = Math.random): boolean {
  if (moveBlocker(s, uid, to)) return false
  const mon = findMon(s, uid)!
  if (to === null && uid === s.activeUid) {
    const candidates = activeCandidates(s, uid)
    s.activeUid = candidates[randInt(0, candidates.length - 1, rng)].uid
  }
  mon.ranch = to
  mon.spot = null
  return true
}

/** Los que sobran de un rancho por encima de su capacidad, empezando por los últimos en llegar y sin tocar al activo */
function overflowOf(s: GameState, ranch: number) {
  const movable = s.owned.filter((m) => m.ranch === ranch && m.uid !== s.activeUid).reverse()
  const extra: typeof movable = []
  let used = usedSlots(s, ranch)
  for (const mon of movable) {
    if (used <= ranchCapacity(s, ranch)) break
    extra.push(mon)
    used--
  }
  return extra
}

/**
 * Arregla los ranchos que tienen más ocupado que espacios (partidas de antes de los espacios, copias del equipo sin
 * las ampliaciones…): lo que sobra va al primer rancho con hueco y, si no cabe en ninguno, a la Caja, aunque se pase
 * de su límite, para no perder ningún Pokémon. Devuelve cuántos ha movido
 */
export function rehomeOverflow(s: GameState): number {
  let moved = 0
  for (let ranch = 0; ranch < ranchCount(s); ranch++) {
    for (const mon of overflowOf(s, ranch)) {
      mon.ranch = ranchWithRoom(s)
      mon.spot = null
      moved++
    }
  }
  return moved
}

/** Deja al Pokémon donde se ha soltado al arrastrarlo, dentro del prado (0–100 %) */
export function placeMon(s: GameState, uid: string, spot: RanchSpot) {
  const mon = findMon(s, uid)
  if (!mon || monPlace(s, uid) !== MonPlace.Ranch) return
  const clamp = (v: number) => Math.min(100, Math.max(0, v))
  mon.spot = { x: clamp(spot.x), y: clamp(spot.y) }
}

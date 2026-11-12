import type { Nature } from '../../data/natures'
import { RARITY_INFO, rarityOf, species } from '../../data/species'
import type { StarItem } from '../../data/starItems'
import { boostedMoney } from '../battle/rewards'
import { ownedOfSpecies, TutorialStep, type GameState } from '../core/state'
import type { Rng } from '../core/random'
import { createMon, NEW_MON_LEVEL } from '../team/mons'
import { randomNature } from '../team/natures'
import { ranchWithRoom } from '../team/ranches'
import { MAX_STARS } from '../team/stats'
import { isSeen, markCaught } from './dex'
import { spendStarItem, starItemBlocker, starItemFor } from './starItems'

/** Piezas iguales que se gastan en cada combinación: desbloquean el Pokémon o le dan una ★ */
export const PIECES_PER_COMBINE = 5
/**
 * ₽ que cuesta combinar piezas para dar cada ★, por las ★ que ya tiene: el primero es lo que cuesta la 1.ª ★ y el
 * último, la de MAX_STARS (crear el Pokémon cuesta según su rareza: `RARITY_INFO.createPrice`)
 */
export const STAR_PRICES = [200, 500, 1000, 1500, 2500]
/** Probabilidad (0–1) de que un Pokémon salga shiny al crearlo con las piezas de siempre */
export const SHINY_CHANCE = 0.05
/** Tickets de la especie que se gastan en vez de PIECES_PER_COMBINE para crearlo shiny seguro (mismo ₽ y objeto estelar) */
export const SHINY_COMBINE_PIECES = 500

/** Qué da combinar: el Pokémon si no lo tienes, una ★ si la admite y, con ★ al máximo, pokécuartos */
export const CombineKind = { Unlock: 'unlock', Star: 'star', Money: 'money' } as const
export type CombineKind = (typeof CombineKind)[keyof typeof CombineKind]

export interface CombineResult {
  kind: CombineKind
  speciesId: number
  level?: number
  /** La naturaleza con la que sale al crearlo */
  nature?: Nature
  /** Si ha salido shiny al crearlo */
  shiny?: boolean
  stars?: number
  money?: number
}

export const piecesOf = (s: GameState, speciesId: number): number => s.pieces[speciesId] ?? 0

/** Suma piezas de una especie; se guardan aunque aún no se haya visto */
export function addPieces(s: GameState, speciesId: number, count: number) {
  s.pieces[speciesId] = piecesOf(s, speciesId) + count
}

export function combineKind(s: GameState, speciesId: number): CombineKind {
  const owned = ownedOfSpecies(s, speciesId)
  if (!owned) return CombineKind.Unlock
  return owned.stars < MAX_STARS ? CombineKind.Star : CombineKind.Money
}

/** ₽ por combinar tickets de un Pokémon que ya tiene las ★ al máximo */
export const surplusMoney = (speciesId: number): number => boostedMoney(RARITY_INFO[rarityOf(species(speciesId))].surplusMoney)

/** Objeto estelar que gasta combinar: solo al crear un Pokémon que no es común (fuera del tutorial); null si ninguno */
export function combineStarItem(s: GameState, speciesId: number): StarItem | null {
  if (combineKind(s, speciesId) !== CombineKind.Unlock || s.tutorial === TutorialStep.Combine) return null
  return starItemFor(speciesId)
}

/** ₽ que cuesta combinar; el inicial del tutorial es gratis y cambiar piezas por ₽ no cuesta nada */
export function combinePrice(s: GameState, speciesId: number): number {
  const kind = combineKind(s, speciesId)
  if (kind === CombineKind.Money || s.tutorial === TutorialStep.Combine) return 0
  if (kind === CombineKind.Unlock) return RARITY_INFO[rarityOf(species(speciesId))].createPrice
  return STAR_PRICES[ownedOfSpecies(s, speciesId)!.stars]
}

/** Por qué no se puede combinar ahora (null si se puede): hay que haberla visto antes */
export function combineBlocker(s: GameState, speciesId: number): string | null {
  if (!isSeen(s, speciesId)) return 'Encuéntralo antes en una ruta.'
  if (piecesOf(s, speciesId) < PIECES_PER_COMBINE) return `Faltan tickets: tienes ${piecesOf(s, speciesId)} de ${PIECES_PER_COMBINE}.`
  if (s.money < combinePrice(s, speciesId)) return `Necesitas ₽ ${combinePrice(s, speciesId)}.`
  const missingItem = combineStarItem(s, speciesId) && starItemBlocker(s, speciesId)
  if (missingItem) return missingItem
  if (combineKind(s, speciesId) === CombineKind.Unlock && ranchWithRoom(s) === null)
    return 'No cabe en ningún rancho: libera espacio o guarda Pokémon en la Caja.'
  return null
}

export const canCombine = (s: GameState, speciesId: number): boolean => combineBlocker(s, speciesId) === null

/** Especies que se pueden combinar ya, de menor a mayor número */
export const combinableIds = (s: GameState): number[] =>
  Object.keys(s.pieces)
    .map(Number)
    .filter((id) => canCombine(s, id))
    .sort((a, b) => a - b)

export const combinableCount = (s: GameState): number => combinableIds(s).length

/** Pone el Pokémon nuevo en el equipo (ya pagado) y lo marca como capturado */
function createOwned(s: GameState, speciesId: number, shiny: boolean, rng: Rng): CombineResult {
  const mon = createMon(speciesId, NEW_MON_LEVEL, ranchWithRoom(s), randomNature(rng), shiny)
  s.owned.push(mon)
  markCaught(s, speciesId)
  // El primer Pokémon (el inicial del tutorial) sale directamente como activo
  s.activeUid ??= mon.uid
  if (s.tutorial === TutorialStep.Combine) s.tutorial = TutorialStep.Route
  return { kind: CombineKind.Unlock, speciesId, level: mon.level, nature: mon.nature, shiny }
}

/** Paga lo que cuesta combinar (₽ y objeto estelar si lo pide) y gasta los tickets */
function payCombine(s: GameState, speciesId: number, pieces: number) {
  const item = combineStarItem(s, speciesId)
  if (item) spendStarItem(s, item)
  s.money -= combinePrice(s, speciesId)
  s.pieces[speciesId] -= pieces
}

/** Por qué no se puede crear shiny seguro (null si se puede): solo al crearlo, fuera del tutorial y con sus tickets */
export function shinyCombineBlocker(s: GameState, speciesId: number): string | null {
  if (combineKind(s, speciesId) !== CombineKind.Unlock) return 'Solo se puede al crearlo.'
  if (s.tutorial === TutorialStep.Combine) return 'Termina antes el tutorial.'
  if (piecesOf(s, speciesId) < SHINY_COMBINE_PIECES) return `Faltan tickets: tienes ${piecesOf(s, speciesId)} de ${SHINY_COMBINE_PIECES}.`
  return combineBlocker(s, speciesId)
}

/** Crea el Pokémon shiny seguro gastando SHINY_COMBINE_PIECES tickets en vez de los de siempre */
export function combineShiny(s: GameState, speciesId: number, rng: Rng = Math.random): CombineResult | null {
  if (shinyCombineBlocker(s, speciesId)) return null
  payCombine(s, speciesId, SHINY_COMBINE_PIECES)
  return createOwned(s, speciesId, true, rng)
}

export function combine(s: GameState, speciesId: number, rng: Rng = Math.random): CombineResult | null {
  if (!canCombine(s, speciesId)) return null
  const kind = combineKind(s, speciesId)
  payCombine(s, speciesId, PIECES_PER_COMBINE)

  if (kind === CombineKind.Unlock) return createOwned(s, speciesId, rng() < SHINY_CHANCE, rng)
  if (kind === CombineKind.Star) {
    const mon = ownedOfSpecies(s, speciesId)!
    mon.stars++
    return { kind, speciesId, stars: mon.stars }
  }
  const money = surplusMoney(speciesId)
  s.money += money
  return { kind, speciesId, money }
}

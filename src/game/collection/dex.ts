import { evolutionsOf, preEvolutionsOf } from '../../data/evolutions'
import { baseSpeciesOf, species } from '../../data/species'
import { ownedOfSpecies, type GameState } from '../core/state'

/** Nombre que se muestra de una especie que aún no se ha visto */
const UNKNOWN_NAME = '???'

export const isSeen = (s: GameState, speciesId: number): boolean => s.seen.includes(speciesId)

/**
 * Solo se llama al ver la especie en una ruta o descubrirla en una expedición; tener piezas no cuenta. Devuelve si es
 * la primera vez que se ve
 */
export function markSeen(s: GameState, speciesId: number): boolean {
  if (isSeen(s, speciesId)) return false
  s.seen.push(speciesId)
  return true
}

export const knownName = (s: GameState, speciesId: number): string =>
  isSeen(s, speciesId) ? species(speciesId).name : UNKNOWN_NAME

const isCaught = (s: GameState, speciesId: number): boolean => s.caught.includes(speciesId)

function addCaught(s: GameState, speciesId: number) {
  markSeen(s, speciesId)
  if (!isCaught(s, speciesId)) s.caught.push(speciesId)
}

/** Capturar una especie cuenta también para las anteriores de su línea evolutiva (Charizard: Charmander y Charmeleon) */
export function markCaught(s: GameState, speciesId: number) {
  for (const id of [speciesId, ...preEvolutionsOf(speciesId)]) addCaught(s, id)
}

/** Repaso al cargar la partida: las capturadas antes de esta regla también dan por capturada su línea anterior */
export function markEvolutionLines(s: GameState) {
  for (const id of [...s.caught]) markCaught(s, id)
}

/** Capturada solo por tener una evolución suya: no hay ninguna en el equipo pero sí una especie a la que evoluciona */
export function isCaughtByLine(s: GameState, speciesId: number): boolean {
  if (!isCaught(s, speciesId) || ownedOfSpecies(s, speciesId)) return false
  return evolutionsOf(speciesId).some((e) => isCaught(s, e.into))
}

/** Favorita la especie (una forma cuenta como su especie) */
export const isFavorite = (s: GameState, speciesId: number): boolean => s.favorites.includes(baseSpeciesOf(speciesId))

/** Marca o desmarca una especie vista como favorita */
export function toggleFavorite(s: GameState, speciesId: number) {
  if (isFavorite(s, speciesId)) s.favorites = s.favorites.filter((id) => id !== speciesId)
  else if (isSeen(s, speciesId)) s.favorites.push(speciesId)
}

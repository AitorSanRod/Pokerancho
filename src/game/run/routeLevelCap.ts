import type { Route } from '../../data/maps'
import { species } from '../../data/species'
import { activeMon, type GameState } from '../core/state'
import { routeGym } from './runGym'

// Nivel máximo para salir a una ruta: el de la propia ruta (`Route.maxLevel`) y el del gimnasio de su parada, el más
// bajo de los dos. Solo cuenta al salir (y al reiniciarla): si el Pokémon lo pasa dentro de la ruta, sigue.

/** Nivel más alto con el que se puede salir a la ruta; null si no hay límite */
export function routeMaxLevel(r: Route): number | null {
  const caps = [r.maxLevel, routeGym(r)?.maxLevel].filter((n): n is number => n !== undefined)
  return caps.length > 0 ? Math.min(...caps) : null
}

/** Por qué el compañero no puede salir a la ruta (pasa de su nivel máximo); null si puede */
export function routeLevelBlocker(s: GameState, r: Route): string | null {
  const cap = routeMaxLevel(r)
  const mon = activeMon(s)
  if (cap === null || !mon || mon.level <= cap) return null
  const place = routeGym(r) ? 'a este gimnasio' : 'a esta ruta'
  return `${species(mon.speciesId).name} (Nv. ${mon.level}) es demasiado fuerte: ${place} solo entran Pokémon de hasta Nv. ${cap}.`
}

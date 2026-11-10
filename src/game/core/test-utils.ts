import { route, wildSpecies } from '../../data/maps'
import { rarityOf, SPECIES, type Rarity } from '../../data/species'
import { markCaught, markSeen } from '../collection/dex'
import { createMon, NEW_MON_LEVEL } from '../team/mons'
import type { Rng } from './random'
import type { GameState } from './state'

/** Rng determinista que devuelve los valores dados en bucle */
export function seqRng(...values: number[]): Rng {
  let i = 0
  return () => values[i++ % values.length]
}

/** Una especie de esa rareza (la `index`-ésima), sin depender de cuál sea hoy */
export function speciesOfRarity(rarity: Rarity, index = 0): number {
  return SPECIES.filter((sp) => rarityOf(sp) === rarity)[index].id
}

/** Da el inicial directamente (Nv. 5, activo) y salta el tutorial */
export function chooseStarter(s: GameState, speciesId: number) {
  const mon = createMon(speciesId, NEW_MON_LEVEL)
  s.owned.push(mon)
  s.activeUid = mon.uid
  s.tutorial = null
  markCaught(s, speciesId)
}

/** Completa la ruta y ve todos sus salvajes, para poder mandar expediciones a ella */
export function readyForExpeditions(s: GameState, routeId: string) {
  if (!s.completedRoutes.includes(routeId)) s.completedRoutes.push(routeId)
  for (const id of wildSpecies(route(routeId))) markSeen(s, id)
}

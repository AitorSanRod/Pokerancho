import { MissionKind } from '../../data/dailyMissions'
import { routeOpens, type Route } from '../../data/maps'
import { baseSpeciesOf } from '../../data/species'
import { boostedMoney } from '../battle/rewards'
import { advanceMission } from '../collection/missions'
import { activeMon, type GameState } from '../core/state'
import { claimRouteStars } from './routeStars'
import { gainRunExp } from './runBattle'

// Final de una ruta completada: misiones, el premio de la primera vez, la ruta que desbloquea y sus estrellas.

/** Completar una ruta cuenta para las misiones de rutas: cualquiera, esa ruta y con ese compañero */
function countRouteMissions(s: GameState, r: Route) {
  advanceMission(s, MissionKind.CompleteRoutes)
  advanceMission(s, MissionKind.CompleteRoute, 1, { routeId: r.id })
  advanceMission(s, MissionKind.CompleteRouteWith, 1, { speciesId: baseSpeciesOf(activeMon(s)!.speciesId) })
}

/**
 * Completa la ruta. Su premio final solo se gana la primera vez; al repetirla quedan los combates y las estrellas que
 * aún falten (routeStars.ts)
 */
export function completeRoute(s: GameState, r: Route) {
  s.run!.phase = 'complete'
  countRouteMissions(s, r)
  if (!s.completedRoutes.includes(r.id)) firstCompletion(s, r)
  claimRouteStars(s, r)
}

/** Premio de la primera vez y las rutas que desbloquea */
function firstCompletion(s: GameState, r: Route) {
  const run = s.run!
  s.completedRoutes.push(r.id)
  s.tickets += r.reward.tickets
  const money = boostedMoney(r.reward.money)
  s.money += money
  run.earned.tickets += r.reward.tickets
  run.earned.money += money
  gainRunExp(s, r.reward.exp)
  for (const id of routeOpens(r)) {
    if (s.unlockedRoutes.includes(id)) continue
    s.unlockedRoutes.push(id)
    run.unlocked.push(id)
  }
}

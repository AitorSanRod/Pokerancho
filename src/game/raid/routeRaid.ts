import type { Route, RouteNode } from '../../data/maps'
import type { Rng } from '../core/random'
import { activeMon, type GameState } from '../core/state'
import { applyPrize, rollPrize } from './raidPrizes'
import type { RaidPrize } from './raidRoom'
import { recordRouteRaidFall, routeRaidMoneyMult } from './routeRaidStreak'

// Jefes comunitarios de las paradas de ruta (NodeKind.Raid): una parada de combate como las demás. El Pokémon de la
// ruta lucha solo contra el jefe, como contra el jefe de una parada (runBattle.ts); si lo vence, además se lleva el
// premio de la tabla de raids de la parada, con menos dinero y EXP si la repite seguida (routeRaidStreak.ts).

/** El premio del jefe (su EXP, para el Pokémon de la ruta) se suma a la partida y a lo ganado en la ruta */
function earnPrize(s: GameState, p: RaidPrize) {
  const earned = s.run!.earned
  earned.levelsGained += applyPrize(s, p)
  earned.exp += p.exp
  earned.money += p.money
  earned.tickets += p.tickets
  earned.pieces.push(...Array<number>(p.pieces).fill(p.bossSpeciesId))
  earned.raidBosses.push(p.bossSpeciesId)
}

/** Tras vencer al jefe de una parada de raid: su premio de raid (rebajado si se repite seguida) va a lo ganado en la ruta */
export function winRouteRaid(s: GameState, r: Route, n: RouteNode, now: number, rng: Rng) {
  const place = { routeId: r.id, nodeId: n.id }
  const mult = routeRaidMoneyMult(s, place, now)
  const p = rollPrize({ speciesId: n.boss!.speciesId, level: n.boss!.level, tier: n.boss!.tier! }, activeMon(s)!.uid, rng)
  earnPrize(s, { ...p, money: Math.round(p.money * mult), exp: Math.round(p.exp * mult) })
  recordRouteRaidFall(s, place, now)
  s.run!.earned.raidMoneyMult = Math.min(s.run!.earned.raidMoneyMult, mult)
}

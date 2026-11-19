import { GYMS, type Gym, type GymId } from '../../data/gyms'
import { node, NodeKind, route, type Route } from '../../data/maps'
import { incursionMove } from '../../data/incursionMoves'
import { species } from '../../data/species'
import type { Rng } from '../core/random'
import type { GameState } from '../core/state'
import { earnBadge } from '../collection/badges'
import { strikeOf } from '../tower/towerMoves'
import { startBattle } from './runBattle'

// Parada de gimnasio (NodeKind.Gym): el líder (data/gyms.ts) saca su equipo uno tras otro y el Pokémon de la ruta lucha
// contra todos sin curarse entre medias, como contra jefes, con el ataque elegido de la ruta (runMove.ts). Ganar al
// último da la medalla la primera vez.

export interface RunGym {
  /** Pokémon del líder contra el que lucha (posición en su equipo) */
  index: number
}

/** La parada en la que está la ruta, si es de gimnasio */
function currentGym(s: GameState): Gym | null {
  const run = s.run
  if (!run) return null
  const n = node(route(run.routeId), run.path[run.stop])
  return n.kind === NodeKind.Gym && n.gym ? GYMS[n.gym] : null
}

/** El gimnasio de la ruta (el de su parada de gimnasio), si es una ruta de gimnasio */
export const routeGymId = (r: Route): GymId | null => r.nodes.find((x) => x.kind === NodeKind.Gym)?.gym ?? null

/** Los líderes de la ruta, en orden (varios en la del Alto Mando) */
export const routeGyms = (r: Route): Gym[] => r.nodes.flatMap((x) => (x.kind === NodeKind.Gym && x.gym ? [GYMS[x.gym]] : []))

export function routeGym(r: Route): Gym | null {
  const id = routeGymId(r)
  return id ? GYMS[id] : null
}

/** En la parada del gimnasio, luchando contra el líder */
export const atGym = (s: GameState): boolean => currentGym(s) !== null && s.run!.gym !== null

/** Llega a la parada del gimnasio: el líder saca a su primer Pokémon */
export function enterGym(s: GameState, r: Route, rng: Rng) {
  const run = s.run!
  run.gym = { index: 0 }
  fightGymFoe(s, r, rng)
}

function fightGymFoe(s: GameState, r: Route, rng: Rng) {
  const gym = currentGym(s)!
  const run = s.run!
  const foe = gym.team[run.gym!.index]
  const name = species(foe.speciesId).name
  const intro = run.gym!.index === 0 ? `¡${gym.leader} te reta! Saca a ${name}.` : `¡${gym.leader} saca a ${name}!`
  const foeMoves = foe.moves?.map((id) => strikeOf(incursionMove(id)))
  const opts = { boss: true, statMult: foe.statMult ?? 1, trainer: gym.leader, intro, foeMoves }
  startBattle(s, r, foe, opts, rng)
}

/** Tras vencer a un Pokémon del líder: si le quedan, saca el siguiente (true); si era el último, false */
export function nextGymFoe(s: GameState, r: Route, rng: Rng): boolean {
  const gym = currentGym(s)
  const run = s.run!
  if (!gym || !run.gym || run.gym.index >= gym.team.length - 1) return false
  run.gym.index++
  fightGymFoe(s, r, rng)
  return true
}

/** Vencido el último Pokémon del líder: su medalla, si es la primera vez */
export function winGym(s: GameState) {
  const gym = currentGym(s)
  if (gym?.badge && earnBadge(s, gym.badge)) s.run!.earned.badge = gym.badge
}

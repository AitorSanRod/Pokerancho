import { incursionMove } from '../../data/incursionMoves'
import { findRoute, node, NodeKind, route, type Route } from '../../data/maps'
import { species } from '../../data/species'
import { TRAINERS, type Trainer } from '../../data/trainers'
import type { Rng } from '../core/random'
import type { GameState } from '../core/state'
import { strikeOf } from '../tower/towerMoves'
import { startBattle } from './runBattle'
import { fixedWho, pickTrainerWho, trainerIdentity, type TrainerWho } from './trainerIdentity'

// Parada de entrenador (NodeKind.Trainer): el entrenador (data/trainers.ts) saca su equipo uno tras otro y el Pokémon de
// la ruta lucha contra todos sin curarse entre medias, como en un gimnasio pero con su ataque de siempre. Sus Pokémon no
// son jefes (premio de dinero y tickets de un salvaje), pero dan más EXP.

/** Multiplicador de la EXP de cada Pokémon de un entrenador (respecto a un salvaje de su nivel) */
export const TRAINER_EXP_MULT = 2

export interface RunTrainer {
  /** Pokémon del entrenador contra el que lucha (posición en su equipo) */
  index: number
  /** Quién le ha tocado ser en esta ruta (género y nombre al azar, al llegar a la parada) */
  who: TrainerWho
}

/** El entrenador de la parada en la que está la ruta, si es de entrenador */
export function currentTrainer(s: GameState): Trainer | null {
  const run = s.run
  if (!run) return null
  const n = node(route(run.routeId), run.path[run.stop])
  return n.kind === NodeKind.Trainer && n.trainer ? TRAINERS[n.trainer] : null
}

/**
 * Quién es el entrenador de una ruta guardada antes de que se eligiera al azar (su nombre fijo o solo el título); null
 * si la parada en la que está ya no es de entrenador
 */
export function legacyTrainerWho(routeId: unknown, path: unknown, stop: unknown): TrainerWho | null {
  const r = typeof routeId === 'string' ? findRoute(routeId) : undefined
  const nodeId = Array.isArray(path) && typeof stop === 'number' ? path[stop] : undefined
  const n = r?.nodes.find((x) => x.id === nodeId)
  return n?.kind === NodeKind.Trainer && n.trainer ? fixedWho(TRAINERS[n.trainer]) : null
}

/** Llega a la parada del entrenador: le toca quién es y saca a su primer Pokémon */
export function enterTrainer(s: GameState, r: Route, rng: Rng) {
  s.run!.trainer = { index: 0, who: pickTrainerWho(currentTrainer(s)!, rng) }
  fightTrainerFoe(s, r, rng)
}

function fightTrainerFoe(s: GameState, r: Route, rng: Rng) {
  const trainer = currentTrainer(s)!
  const { index, who: picked } = s.run!.trainer!
  const foe = trainer.team[index]
  const name = species(foe.speciesId).name
  const who = trainerIdentity(trainer, picked).name
  const intro = index === 0 ? `¡${who} te reta! Saca a ${name}.` : `¡${who} saca a ${name}!`
  const foeMoves = foe.moves?.map((id) => strikeOf(incursionMove(id)))
  const opts = { boss: false, statMult: foe.statMult ?? 1, trainer: who, intro, foeMoves, expMult: TRAINER_EXP_MULT }
  startBattle(s, r, foe, opts, rng)
}

/**
 * Tras vencer a un Pokémon del entrenador: si le quedan, saca el siguiente (true); si era el último o la parada no es
 * de entrenador, la ruta sigue sin él (false)
 */
export function nextTrainerFoe(s: GameState, r: Route, rng: Rng): boolean {
  const trainer = currentTrainer(s)
  const run = s.run!
  if (!trainer || !run.trainer || run.trainer.index >= trainer.team.length - 1) {
    run.trainer = null
    return false
  }
  run.trainer.index++
  fightTrainerFoe(s, r, rng)
  return true
}

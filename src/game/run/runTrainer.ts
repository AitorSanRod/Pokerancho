import { incursionMove } from '../../data/incursionMoves'
import { node, NodeKind, route, type Route } from '../../data/maps'
import { species } from '../../data/species'
import { TRAINERS, type Trainer } from '../../data/trainers'
import type { Rng } from '../core/random'
import type { GameState } from '../core/state'
import { strikeOf } from '../tower/towerMoves'
import { startBattle } from './runBattle'

// Parada de entrenador (NodeKind.Trainer): el entrenador (data/trainers.ts) saca su equipo uno tras otro y el Pokémon de
// la ruta lucha contra todos sin curarse entre medias, como en un gimnasio pero con su ataque de siempre. Sus Pokémon no
// son jefes (premio de dinero y tickets de un salvaje), pero dan más EXP.

/** Multiplicador de la EXP de cada Pokémon de un entrenador (respecto a un salvaje de su nivel) */
export const TRAINER_EXP_MULT = 2

export interface RunTrainer {
  /** Pokémon del entrenador contra el que lucha (posición en su equipo) */
  index: number
}

/** El entrenador de la parada en la que está la ruta, si es de entrenador */
export function currentTrainer(s: GameState): Trainer | null {
  const run = s.run
  if (!run) return null
  const n = node(route(run.routeId), run.path[run.stop])
  return n.kind === NodeKind.Trainer && n.trainer ? TRAINERS[n.trainer] : null
}

/** Llega a la parada del entrenador: saca a su primer Pokémon */
export function enterTrainer(s: GameState, r: Route, rng: Rng) {
  s.run!.trainer = { index: 0 }
  fightTrainerFoe(s, r, rng)
}

function fightTrainerFoe(s: GameState, r: Route, rng: Rng) {
  const trainer = currentTrainer(s)!
  const { index } = s.run!.trainer!
  const foe = trainer.team[index]
  const name = species(foe.speciesId).name
  const intro = index === 0 ? `¡${trainer.name} te reta! Saca a ${name}.` : `¡${trainer.name} saca a ${name}!`
  const foeMoves = foe.moves?.map((id) => strikeOf(incursionMove(id)))
  const opts = { boss: false, statMult: foe.statMult ?? 1, trainer: trainer.name, intro, foeMoves, expMult: TRAINER_EXP_MULT }
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

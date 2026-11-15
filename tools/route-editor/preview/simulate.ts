// Simulación de la ruta del borrador con el motor del juego: un Pokémon recién creado (sin rancho, estrellas ni toques
// críticos, así que algo más flojo que el de un jugador) la recorre varias veces sin tocar la pantalla.

import { GYMS, type Gym, type GymId } from '../../../src/data/gyms'
import { KANTO, type Route } from '../../../src/data/maps'
import { TRAINERS, type Trainer, type TrainerId } from '../../../src/data/trainers'
import { initialState, type GameState } from '../../../src/game/core/state'
import { advanceRun, startRun } from '../../../src/game/run/run'
import { gymLevelBlocker } from '../../../src/game/run/runGym'
import { createMon } from '../../../src/game/team/mons'

/** Milisegundos reales que avanza cada paso de la simulación */
const TICK_MS = 250
/** Tope de una ruta simulada (por si se queda atascada) */
const MAX_MS = 3 * 3_600_000

export interface Companion {
  speciesId: number
  level: number
}

/** Un entrenador o un gimnasio del borrador, que se pone en los datos mientras dura la simulación */
export interface SimPatch {
  trainer?: [TrainerId, Trainer]
  gym?: [GymId, Gym]
}

export interface SimResult {
  runs: number
  completed: number
  /** Por qué el Pokémon no puede salir a la ruta (nivel máximo de un gimnasio) */
  blocked?: string
  /** Cuántas veces cae en cada parada (por su posición en la ruta) */
  fallsAt: number[]
  /** Medias de todas las vueltas, en milisegundos */
  totalMs: number
  battleMs: number
  healMs: number
  /** Media de las vueltas completadas; 0 si ninguna */
  completedMs: number
}

function companionState(route: Route, c: Companion): GameState {
  const s = initialState()
  const mon = createMon(c.speciesId, c.level)
  s.owned.push(mon)
  s.activeUid = mon.uid
  s.tutorial = null
  s.unlockedRoutes.push(route.id)
  return s
}

function playOnce(route: Route, c: Companion) {
  const s = companionState(route, c)
  startRun(s, route.id)
  const run = s.run
  if (!run) return { blocked: gymLevelBlocker(s, route) ?? 'No puede salir a la ruta' }
  let ms = 0
  let battleMs = 0
  let healMs = 0
  while (run.phase === 'walking' && ms < MAX_MS) {
    if (run.battleMsLeft > 0) battleMs += TICK_MS
    else if (run.heal) healMs += TICK_MS
    advanceRun(s, TICK_MS)
    ms += TICK_MS
  }
  return { phase: run.phase, stop: run.stop, ms, battleMs, healMs }
}

/** Pone la ruta y lo del parche en los datos del juego mientras dura `fn`, y lo deja luego como estaba */
function withDraftData<T>(route: Route, patch: SimPatch, fn: () => T): T {
  const routes = KANTO.routes
  const before = [...routes]
  const at = routes.findIndex((r) => r.id === route.id)
  if (at >= 0) routes[at] = route
  else routes.push(route)
  const trainers = TRAINERS as Record<string, Trainer>
  const gyms = GYMS as Record<string, Gym>
  const oldTrainer = patch.trainer && trainers[patch.trainer[0]]
  const oldGym = patch.gym && gyms[patch.gym[0]]
  if (patch.trainer) trainers[patch.trainer[0]] = patch.trainer[1]
  if (patch.gym) gyms[patch.gym[0]] = patch.gym[1]
  try {
    return fn()
  } finally {
    routes.splice(0, routes.length, ...before)
    if (patch.trainer) trainers[patch.trainer[0]] = oldTrainer!
    if (patch.gym) gyms[patch.gym[0]] = oldGym!
  }
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0)

export function simulate(route: Route, c: Companion, runs: number, patch: SimPatch = {}): SimResult {
  const plays = withDraftData(route, patch, () => Array.from({ length: runs }, () => playOnce(route, c)))
  const first = plays[0]
  const empty = { runs, completed: 0, fallsAt: [], totalMs: 0, battleMs: 0, healMs: 0, completedMs: 0 }
  if (!first || 'blocked' in first) return { ...empty, blocked: first?.blocked }
  const done = plays.filter((p) => 'phase' in p && p.phase === 'complete') as Exclude<(typeof plays)[number], { blocked: string }>[]
  const all = plays as typeof done
  const fallsAt = Array.from({ length: route.nodes.length }, (_, i) => all.filter((p) => p.phase === 'fainted' && p.stop === i).length)
  return {
    runs,
    completed: done.length,
    fallsAt,
    totalMs: mean(all.map((p) => p.ms)),
    battleMs: mean(all.map((p) => p.battleMs)),
    healMs: mean(all.map((p) => p.healMs)),
    completedMs: mean(done.map((p) => p.ms)),
  }
}

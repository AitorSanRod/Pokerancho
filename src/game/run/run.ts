import { isValidPath, legSteps, node, NodeKind, pathFrom, route, type Route } from '../../data/maps'
import { species } from '../../data/species'
import type { Rng } from '../core/random'
import { activeMon, MonPlace, monPlace, TutorialStep, type GameState, type Run } from '../core/state'
import { advanceRouteRaid, enterRouteRaid } from '../raid/routeRaid'
import { stepsPerMinute } from '../team/stats'
import { advanceExpBoost, boostActive, BOOST_TAP_EXP, newExpBoost, reachEggSpot } from './expBoost'
import { completeRoute, gainRunExp, spendBattleTime, startStopBattle } from './runBattle'
import { spendHealTime, drinkStopPotion } from './runHeal'
import { enterGym, gymLevelBlocker } from './runGym'

export function runBlocker(s: GameState): string | null {
  if (activeMon(s) && s.run) return 'Ya hay una ruta en curso.'
  return monBlocker(s)
}

/** Lo que impide al Pokémon activo salir de ruta, sin contar la ruta en curso */
function monBlocker(s: GameState): string | null {
  const mon = activeMon(s)
  if (!mon) return 'No tienes Pokémon activo.'
  const name = species(mon.speciesId).name
  if (monPlace(s, mon.uid) === MonPlace.Expedition) return `${name} está de expedición.`
  if (monPlace(s, mon.uid) === MonPlace.Raid) return `${name} está luchando contra el jefe.`
  if (monPlace(s, mon.uid) === MonPlace.Incursion) return `${name} está en una incursión.`
  if (monPlace(s, mon.uid) === MonPlace.Tower) return `${name} está en la torre: termínala o abandónala antes.`
  if (mon.hp < 1) return `${name} está debilitado. Déjalo descansar o cúralo en el rancho.`
  return null
}

/** Sale a la ruta con el camino ya elegido; a partir de aquí todo es automático */
export function startRun(s: GameState, routeId: string, path = pathFrom(route(routeId)), rng: Rng = Math.random) {
  if (runBlocker(s) || !s.unlockedRoutes.includes(routeId) || !isValidPath(route(routeId), path) || gymLevelBlocker(s, route(routeId))) return
  if (s.tutorial === TutorialStep.Route) s.tutorial = null
  s.run = {
    routeId,
    path,
    stop: 0,
    steps: 0,
    phase: 'walking',
    lastBattle: null,
    battleSetup: null,
    battleMsLeft: 0,
    raid: null,
    raidRejoinHp: null,
    heal: null,
    boost: newExpBoost(routeId, path, s.luckyEggArmed, rng),
    unlocked: null,
    gym: null,
    earned: { money: 0, tickets: 0, pieces: [], exp: 0, levelsGained: 0, wins: 0, battles: 0, raidBosses: [], raidMoneyMult: 1, discovered: [], badge: null },
  }
  s.luckyEggArmed = false
}

/** Caminando de verdad: ni en combate ni curándose */
const isWalking = (run: Run): boolean => run.phase === 'walking' && run.battleMsLeft === 0 && !run.heal

/**
 * Avanza la ruta `realMs` milisegundos reales. Durante un combate o una cura el tiempo se gasta en ellos y no se dan pasos;
 * fuera de combate se camina según la velocidad del Pokémon y `timeScale`. Puede cruzar varias paradas y
 * combates de una vez, p. ej. al volver tras un rato.
 */
export function advanceRun(s: GameState, realMs: number, rng: Rng = Math.random) {
  const run = s.run
  if (run && isWalking(run)) advanceExpBoost(run, realMs)
  let left = realMs
  while (run && left > 0) {
    if (run.battleMsLeft > 0) {
      left -= spendBattleTime(s, route(run.routeId), left, rng)
      continue
    }
    if (run.heal) {
      left -= spendHealTime(s, route(run.routeId), left)
      continue
    }
    if (run.phase === 'raid') {
      const used = advanceRouteRaid(s, left * s.timeScale, rng) / s.timeScale
      if (used === 0 && run.phase === 'raid') return
      left -= used
      continue
    }
    if (run.phase !== 'walking') return
    const stepsPerMs = (stepsPerMinute(activeMon(s)!) * s.timeScale) / 60000
    const steps = left * stepsPerMs
    const used = walk(s, steps, rng)
    if (used >= steps) return
    left -= used / stepsPerMs
  }
}

/** Camina hasta la siguiente parada como mucho (allí combate). Devuelve los pasos usados; 0 si hay combate. */
export function walk(s: GameState, steps: number, rng: Rng = Math.random): number {
  const run = s.run
  if (!run || !isWalking(run)) return 0
  const r = route(run.routeId)
  const needed = legSteps(r, run.path, run.stop + 1) - run.steps
  reachEggSpot(run, run.steps + steps, rng)
  if (steps < needed) {
    run.steps += steps
    return steps
  }
  arrive(s, r, rng)
  return needed
}

/**
 * Tocar la escena caminando da un paso (y, con el Huevo Suerte usado, EXP); los combates y la cura van siempre a su
 * velocidad, sin adelantarse. Devuelve si el toque contó
 */
export function tapRun(s: GameState): boolean {
  const run = s.run
  if (!run || !isWalking(run)) return false
  walk(s, 1)
  if (boostActive(run)) gainRunExp(s, BOOST_TAP_EXP)
  return true
}

function arrive(s: GameState, r: Route, rng: Rng) {
  const run = s.run!
  run.stop++
  run.steps = 0
  const n = node(r, run.path[run.stop])
  // Con combate o cura, el final de la ruta se decide al acabar (ver runBattle.ts y runHeal.ts) o al caer el jefe comunitario
  if (n.kind === NodeKind.Wild || n.kind === NodeKind.Boss) startStopBattle(s, r, n, rng)
  else if (n.kind === NodeKind.Raid) enterRouteRaid(s, r, n, rng)
  else if (n.kind === NodeKind.Heal) drinkStopPotion(s, n)
  else if (n.kind === NodeKind.Gym) enterGym(s, r, rng)
  else if (run.stop === run.path.length - 1) completeRoute(s, r)
}

/**
 * Lo que impide reiniciar la ruta en curso: cuando se puede abandonar (caminando, también en pleno combate) y si podría
 * volver a salir a ella
 */
export function restartBlocker(s: GameState): string | null {
  const run = s.run
  if (!run || run.phase !== 'walking') return 'Solo se puede reiniciar mientras camina.'
  return monBlocker(s) ?? gymLevelBlocker(s, route(run.routeId))
}

/**
 * Vuelve a salir a la misma ruta desde el principio, como al empezarla: las paradas y sus rivales se sortean de nuevo.
 * Se conserva lo ganado hasta ahora (como al abandonar), el Huevo Suerte usado y, en un gimnasio, el ataque elegido
 */
export function restartRun(s: GameState, rng: Rng = Math.random) {
  if (restartBlocker(s)) return
  const { routeId, gym, boost } = s.run!
  endRun(s)
  startRun(s, routeId, pathFrom(route(routeId)), rng)
  if (s.run && gym) s.run.gym = { index: 0, moveId: gym.moveId }
  if (s.run) s.run.boost.active ||= boost.active
}

/** Volver al rancho: al terminar la ruta o abandonándola (se conserva lo ganado) */
export function endRun(s: GameState) {
  s.run = null
}

import { GYMS, type Gym, type GymId } from '../../data/gyms'
import { node, NodeKind, route, type Route } from '../../data/maps'
import { incursionMove } from '../../data/incursionMoves'
import { species } from '../../data/species'
import type { Rng } from '../core/random'
import { activeMon, type GameState, type OwnedMon } from '../core/state'
import { earnBadge } from '../collection/badges'
import { strikeOf, towerMove, towerMoveChoices } from '../tower/towerMoves'
import { BATTLE_EVENT_MS } from './battleTimeline'
import { startBattle } from './runBattle'
import { battleElapsed, critOrdinals, replayBattle } from './tapCrit'

// Parada de gimnasio (NodeKind.Gym): el líder (data/gyms.ts) saca su equipo uno tras otro y el Pokémon de la ruta lucha
// contra todos sin curarse entre medias, como contra jefes. Lucha con un ataque de daño de su repertorio (como en la
// torre), que el jugador puede cambiar antes de llegar o en pleno combate: desde su siguiente ataque. Ganar al último da
// la medalla la primera vez.

export interface RunGym {
  /** Pokémon del líder contra el que lucha (posición en su equipo) */
  index: number
  /** Ataque elegido (de su repertorio de incursión) */
  moveId: string
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

export function routeGym(r: Route): Gym | null {
  const id = routeGymId(r)
  return id ? GYMS[id] : null
}

/** Por qué el compañero no puede entrar en el gimnasio de la ruta (pasa de su nivel máximo); null si puede o no es un gimnasio */
export function gymLevelBlocker(s: GameState, r: Route): string | null {
  const gym = routeGym(r)
  const mon = activeMon(s)
  if (!gym || !mon || mon.level <= gym.maxLevel) return null
  return `${species(mon.speciesId).name} (Nv. ${mon.level}) es demasiado fuerte: a este gimnasio solo entran Pokémon de hasta Nv. ${gym.maxLevel}.`
}

/** En la parada del gimnasio, luchando contra el líder */
export const atGym = (s: GameState): boolean => currentGym(s) !== null && s.run!.gym !== null

/** Peso de un ataque de su tipo al elegir el de salida (el mismo bonus que en el daño) */
const STAB_SCORE = 1.5

/** Ataque con el que empieza si no se elige otro: el de más potencia, contando el bonus por ser de su tipo */
export function defaultGymMove(mon: OwnedMon): string {
  const types = species(mon.speciesId).types
  const score = (id: string) => {
    const mv = towerMove(mon, id)
    return mv.power * (types.includes(mv.type) ? STAB_SCORE : 1)
  }
  return towerMoveChoices(mon).map((m) => m.id).sort((a, b) => score(b) - score(a))[0] ?? ''
}

/**
 * Elige el ataque del gimnasio: antes de llegar a la parada o en pleno combate contra el líder, y entonces desde el
 * siguiente ataque de su Pokémon (lo ya visto no cambia)
 */
export function pickGymMove(s: GameState, moveId: string, now: number) {
  const run = s.run
  const mon = activeMon(s)
  if (!run || !mon || !routeGym(route(run.routeId)) || !towerMoveChoices(mon).some((m) => m.id === moveId)) return
  run.gym = { index: run.gym?.index ?? 0, moveId }
  if (currentGym(s) && run.battleSetup && run.lastBattle && run.battleMsLeft > 0) switchMidBattle(s, mon, now)
}

/** Número de ataques que ya ha empezado el jugador en el momento `elapsed` del combate */
function playerAttacksBy(s: GameState, elapsed: number): number {
  let at = 0
  let count = 0
  for (const e of s.run!.lastBattle!.events) {
    if (at > elapsed) break
    if (e.kind === 'attack' && e.side === 'player') count++
    at += BATTLE_EVENT_MS[e.kind]
  }
  return count
}

function switchMidBattle(s: GameState, mon: OwnedMon, now: number) {
  const run = s.run!
  const setup = run.battleSetup!
  const elapsed = battleElapsed(s, now)
  const fromAttack = playerAttacksBy(s, elapsed) + 1
  const crits = critOrdinals(run.lastBattle!, setup)
  const kept = (setup.player.moveSwitches ?? []).filter((sw) => sw.fromAttack < fromAttack)
  setup.player.moveSwitches = [...kept, { fromAttack, move: towerMove(mon, run.gym!.moveId) }]
  replayBattle(s, crits, elapsed, now)
}

/** Llega a la parada del gimnasio: el líder saca a su primer Pokémon */
export function enterGym(s: GameState, r: Route, rng: Rng) {
  const run = s.run!
  run.gym = { index: 0, moveId: run.gym?.moveId ?? defaultGymMove(activeMon(s)!) }
  fightGymFoe(s, r, rng)
}

function fightGymFoe(s: GameState, r: Route, rng: Rng) {
  const gym = currentGym(s)!
  const run = s.run!
  const mon = activeMon(s)!
  const foe = gym.team[run.gym!.index]
  const name = species(foe.speciesId).name
  const intro = run.gym!.index === 0 ? `¡${gym.leader} te reta! Saca a ${name}.` : `¡${gym.leader} saca a ${name}!`
  const foeMoves = foe.moves?.map((id) => strikeOf(incursionMove(id)))
  const opts = { boss: true, statMult: foe.statMult ?? 1, move: towerMove(mon, run.gym!.moveId), trainer: gym.leader, intro, foeMoves }
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
  if (gym && earnBadge(s, gym.badge)) s.run!.earned.badge = gym.badge
}

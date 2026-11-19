import { legSteps, node, NodeKind, type Boss, type Route, type RouteNode } from '../../data/maps'
import { TrainerClass, type Trainer } from '../../data/trainers'
import { species } from '../../data/species'
import { moneyReward } from '../battle/rewards'
import { addPieces } from '../collection/pieces'
import { pickEncounter, pickWeighted, randInt, type Rng } from '../core/random'
import type { GameState, Run, RunSurprise } from '../core/state'
import { startStopBattle } from './runBattle'
import { completeRoute } from './runComplete'
import { enterTrainer } from './runTrainer'

// Parada sorpresa: al repetir una ruta ya completada, a veces una de sus paradas de salvajes trae otra cosa en esta
// salida (un cofre, una horda, un Pokémon poco común o un entrenador que te reta). Se sortea al salir y no se ve en el
// mapa de paradas hasta llegar a ella.

export const SurpriseKind = { Chest: 'chest', Horde: 'horde', Rare: 'rare', Rival: 'rival' } as const
export type SurpriseKind = (typeof SurpriseKind)[keyof typeof SurpriseKind]

/** Probabilidad (0–1) de que una salida a una ruta ya completada traiga parada sorpresa */
export const SURPRISE_CHANCE = 0.4
/** Peso de cada sorpresa al sortearla (más peso, más a menudo) */
export const SURPRISE_WEIGHTS: Record<SurpriseKind, number> = { chest: 40, horde: 25, rival: 20, rare: 15 }
/** Salvajes que salen seguidos en una horda, sin curarse entre medias */
export const HORDE_SIZE = 3
/** Niveles que suma el Pokémon poco común a los de su parada (siempre suelta un ticket suyo al vencerlo) */
export const RARE_LEVEL_BONUS = 2
/** Pokémon que saca el entrenador rival, sacados de los salvajes de la parada */
export const RIVAL_TEAM_SIZE = 2
/** Niveles que suma cada Pokémon del entrenador rival al nivel máximo de la ruta */
export const RIVAL_LEVEL_BONUS = 1
/** Clases que puede tener el entrenador rival */
const RIVAL_CLASSES: TrainerClass[] = [TrainerClass.Youngster, TrainerClass.Camper, TrainerClass.Hiker, TrainerClass.BirdKeeper, TrainerClass.BugCatcher]
/** Milisegundos reales que el Pokémon se queda abriendo el cofre */
export const CHEST_STOP_MS = 2200
/** Dinero del cofre, en victorias contra un salvaje del nivel máximo de la ruta por el tramo de la parada */
export const CHEST_MONEY_WINS = 4
/** Tickets de gacha que trae el cofre */
export const CHEST_TICKETS = 1
/** Tickets de especie que trae el cofre, de los Pokémon salvajes de su parada */
export const CHEST_PIECES = 2

/** Lo que cambia una sorpresa en el combate de su parada (`startStopBattle`): otro rival, su texto y su premio */
export interface StopFoe {
  rival?: Boss
  intro?: string
  /** Suelta seguro un ticket de su especie al vencerlo */
  piece?: boolean
}

const pickOne = <T>(list: readonly T[], rng: Rng): T => list[Math.floor(rng() * list.length)]

const wildPool = (r: Route, n: RouteNode) => n.encounters ?? r.encounters

/** Entrenador rival de la parada: una clase al azar y un equipo de salvajes de la parada al nivel máximo de la ruta */
function rivalTrainer(r: Route, n: RouteNode, rng: Rng): Trainer {
  const level = r.levels[1] + (n.levelBonus ?? 0) + RIVAL_LEVEL_BONUS
  const team = Array.from({ length: RIVAL_TEAM_SIZE }, () => ({ speciesId: pickEncounter(wildPool(r, n), rng), level }))
  return { trainerClass: pickOne(RIVAL_CLASSES, rng), team }
}

/** Sorteo al salir: en una ruta ya completada, quizá una de las paradas de salvajes del camino sea una sorpresa */
export function rollSurprise(s: GameState, r: Route, path: string[], rng: Rng): RunSurprise | null {
  if (!s.completedRoutes.includes(r.id) || rng() >= SURPRISE_CHANCE) return null
  const wild = path.map((id, stop) => ({ n: node(r, id), stop })).filter(({ n }) => n.kind === NodeKind.Wild)
  if (wild.length === 0) return null
  const { n, stop } = pickOne(wild, rng)
  const kind = pickWeighted(Object.entries(SURPRISE_WEIGHTS) as [SurpriseKind, number][], rng)
  return { kind, stop, left: kind === SurpriseKind.Horde ? HORDE_SIZE - 1 : 0, trainer: kind === SurpriseKind.Rival ? rivalTrainer(r, n, rng) : null }
}

/** La sorpresa de la parada en la que está la ruta, si la tiene */
export const surpriseHere = (run: Run): RunSurprise | null => (run.surprise?.stop === run.stop ? run.surprise : null)

/** La especie menos probable de la parada: la que sale como Pokémon poco común */
function rarestOf(r: Route, n: RouteNode): number {
  return wildPool(r, n).reduce((rarest, e) => (e.chance < rarest.chance ? e : rarest)).speciesId
}

/** Al llegar a la parada sorpresa: en lugar de su salvaje de siempre, lo que le haya tocado */
export function enterSurprise(s: GameState, r: Route, n: RouteNode, surprise: RunSurprise, rng: Rng) {
  switch (surprise.kind) {
    case SurpriseKind.Chest:
      return openChest(s, r, n, rng)
    case SurpriseKind.Horde:
      return startStopBattle(s, r, n, rng, { intro: hordeIntro(surprise) })
    case SurpriseKind.Rare: {
      const speciesId = rarestOf(r, n)
      const level = randInt(r.levels[0], r.levels[1], rng) + (n.levelBonus ?? 0) + RARE_LEVEL_BONUS
      const intro = `¡Un ${species(speciesId).name} poco común de Nv. ${level} apareció!`
      return startStopBattle(s, r, n, rng, { rival: { speciesId, level }, intro, piece: true })
    }
    case SurpriseKind.Rival:
      return enterTrainer(s, r, rng)
  }
}

const hordeIntro = (h: RunSurprise): string => `¡Una horda de Pokémon salvajes! (${HORDE_SIZE - h.left}/${HORDE_SIZE})`

/** Tras vencer a uno de la horda: si quedan, sale el siguiente (true); si no o no hay horda aquí, la ruta sigue (false) */
export function nextHordeFoe(s: GameState, r: Route, rng: Rng): boolean {
  const run = s.run!
  const horde = surpriseHere(run)
  if (horde?.kind !== SurpriseKind.Horde || horde.left === 0) return false
  horde.left--
  startStopBattle(s, r, node(r, run.path[run.stop]), rng, { intro: hordeIntro(horde) })
  return true
}

/** Abre el cofre: su botín se suma ya y el Pokémon se queda parado CHEST_STOP_MS */
function openChest(s: GameState, r: Route, n: RouteNode, rng: Rng) {
  const run = s.run!
  const money = moneyReward(r.levels[1], legSteps(r, run.path, run.stop), rng) * CHEST_MONEY_WINS
  const pieces = Array.from({ length: CHEST_PIECES }, () => pickEncounter(wildPool(r, n), rng))
  s.money += money
  s.tickets += CHEST_TICKETS
  for (const id of pieces) addPieces(s, id, 1)
  run.earned.money += money
  run.earned.tickets += CHEST_TICKETS
  run.earned.pieces.push(...pieces)
  run.chest = { money, tickets: CHEST_TICKETS, pieces, msLeft: CHEST_STOP_MS }
}

/** Gasta hasta `ms` del cofre; al acabarse, sigue caminando o completa la ruta. Devuelve lo gastado */
export function spendChestTime(s: GameState, r: Route, ms: number): number {
  const run = s.run!
  const chest = run.chest!
  const spent = Math.min(ms, chest.msLeft)
  chest.msLeft -= spent
  if (chest.msLeft > 0) return spent
  run.chest = null
  if (run.stop === run.path.length - 1) completeRoute(s, r)
  return spent
}

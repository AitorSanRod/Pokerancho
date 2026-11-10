import { effectiveness, type PokeType } from '../../data/types'
import type { Rng } from '../core/random'
import { allies, enemies, type Battlefield } from './battlefield'
import { Team, type GroupFighter } from './fighter'
import { pickedTarget } from './movePicks'

// A quién va cada movimiento. Los golpes y estados contra un solo rival van al que provoca, si hay alguno; si no, al que
// haya elegido el jugador (ver movePicks.ts), mientras siga en pie.

const pick = <T>(list: T[], rng: Rng): T => list[Math.floor(rng() * list.length)]
const hpFraction = (f: GroupFighter) => f.hp / f.maxHp

function taunter(bf: Battlefield, actor: GroupFighter): GroupFighter | null {
  return enemies(bf, actor).find((e) => e.taunt) ?? null
}

/**
 * Golpe a un rival: el que provoca; si no, el grupo elige al más débil a su tipo y los rivales, a uno al azar
 * (empates, al azar)
 */
export function strikeTarget(bf: Battlefield, actor: GroupFighter, type: PokeType, rng: Rng): GroupFighter | null {
  const foes = enemies(bf, actor)
  if (foes.length === 0) return null
  const forced = taunter(bf, actor) ?? pickedTarget(actor, foes)
  if (forced) return forced
  if (actor.team === Team.Foe) return pick(foes, rng)
  const best = Math.max(...foes.map((f) => effectiveness(type, f.types)))
  return pick(foes.filter((f) => effectiveness(type, f.types) === best), rng)
}

/** Bajada de stats a un rival: el que provoca; si no, el que tiene más PS (normalmente el jefe) */
export function debuffTarget(bf: Battlefield, actor: GroupFighter): GroupFighter | null {
  const foes = enemies(bf, actor)
  if (foes.length === 0) return null
  return taunter(bf, actor) ?? pickedTarget(actor, foes) ?? foes.reduce((a, b) => (b.hp > a.hp ? b : a))
}

/** Estado a un rival: el que provoca; si no, uno al azar que no tenga ya un estado */
export function inflictTarget(bf: Battlefield, actor: GroupFighter, rng: Rng): GroupFighter | null {
  const forced = taunter(bf, actor) ?? pickedTarget(actor, enemies(bf, actor))
  if (forced) return forced
  const free = enemies(bf, actor).filter((f) => !f.status)
  return free.length ? pick(free, rng) : null
}

/** Cura a un aliado: el que tiene menos PS en proporción */
export function healTarget(bf: Battlefield, actor: GroupFighter): GroupFighter | null {
  const team = allies(bf, actor)
  const chosen = pickedTarget(actor, team)
  if (chosen) return chosen
  return team.length ? team.reduce((a, b) => (hpFraction(b) < hpFraction(a) ? b : a)) : null
}

// Lo que se ve en una parada de la ruta: los rivales (uno tras otro, como los saca un entrenador; los salvajes, del más
// probable al menos), quién los saca o la poción de la parada.

import { GYMS } from '../../../src/data/gyms'
import { NodeKind, type Boss, type Encounter, type Route, type RouteNode } from '../../../src/data/maps'
import type { Potion } from '../../../src/data/potions'
import { TRAINERS } from '../../../src/data/trainers'
import { LEADER_SPRITES } from '../../../src/ui/route/gym/leaderSprites'
import { trainerPortrait } from '../../../src/ui/route/gym/trainerSprites'

export interface StageTrainer {
  name: string
  sprite?: string
}

export interface Stage {
  /** Rivales que se pueden ver, en orden */
  foes: Boss[]
  /** Se ven como jefe (más grandes y con aviso) */
  boss: boolean
  trainer?: StageTrainer
  /** Probabilidad de cada rival, si son salvajes */
  chances?: number[]
  potion?: Potion
}

function wildStage(r: Route, n: RouteNode): Stage {
  const list: Encounter[] = [...(n.encounters ?? r.encounters)].sort((a, b) => b.chance - a.chance)
  const level = r.levels[1] + (n.levelBonus ?? 0)
  return { foes: list.map((e) => ({ speciesId: e.speciesId, level })), boss: false, chances: list.map((e) => e.chance) }
}

/** Lo que se ve al llegar a la parada `n` de la ruta (con los datos del juego para entrenadores y líderes) */
export function stopStage(r: Route, n: RouteNode): Stage {
  if (n.kind === NodeKind.Wild) return wildStage(r, n)
  if ((n.kind === NodeKind.Boss || n.kind === NodeKind.Raid) && n.boss) return { foes: [n.boss], boss: true }
  if (n.kind === NodeKind.Trainer && n.trainer) {
    const t = TRAINERS[n.trainer]
    return { foes: t.team, boss: false, trainer: trainerPortrait(t) }
  }
  if (n.kind === NodeKind.Gym && n.gym) {
    const g = GYMS[n.gym]
    return { foes: g.team, boss: true, trainer: { name: g.leader, sprite: LEADER_SPRITES[n.gym] } }
  }
  if (n.kind === NodeKind.Heal && n.potion) return { foes: [], boss: false, potion: n.potion }
  return { foes: [], boss: false }
}

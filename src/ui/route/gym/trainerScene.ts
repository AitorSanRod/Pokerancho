import { GYMS } from '../../../data/gyms'
import { node, NodeKind, route } from '../../../data/maps'
import { species } from '../../../data/species'
import { TRAINERS } from '../../../data/trainers'
import type { TrainerTeam } from '../../../data/trainerTeam'
import type { Run } from '../../../game/core/state'
import { LEADER_SPRITES } from './leaderSprites'
import { trainerPortrait } from './trainerSprites'

/** Lo que se ve del combate contra un líder de gimnasio o un entrenador: quién es, cuántos Pokémon tiene y cuál ha sacado */
export interface TrainerScene {
  name: string
  /** Su dibujo; sin él, se juega igual sin el entrenador a la vista */
  sprite?: string
  /** Su Pokémon en combate (posición en su equipo) */
  index: number
  total: number
  foeName: string
}

const sceneOf = (name: string, sprite: string | undefined, team: TrainerTeam, index: number): TrainerScene => ({
  name,
  sprite,
  index,
  total: team.length,
  foeName: species(team[index].speciesId).name,
})

/** El combate contra el líder o el entrenador de la parada en curso; null si la parada no es de ninguno de los dos */
export function trainerScene(run: Run): TrainerScene | null {
  const n = node(route(run.routeId), run.path[run.stop])
  if (n.kind === NodeKind.Gym && n.gym && run.gym) return sceneOf(GYMS[n.gym].leader, LEADER_SPRITES[n.gym], GYMS[n.gym].team, run.gym.index)
  if (n.kind === NodeKind.Trainer && n.trainer && run.trainer) {
    const trainer = TRAINERS[n.trainer]
    const { name, sprite } = trainerPortrait(trainer, run.trainer.who)
    return sceneOf(name, sprite, trainer.team, run.trainer.index)
  }
  return null
}

/** Lo que anuncia al sacar a su Pokémon */
export const sendOutText = (t: TrainerScene): string => (t.index === 0 ? `¡${t.name} te reta!` : `¡${t.name} saca a ${t.foeName}!`)

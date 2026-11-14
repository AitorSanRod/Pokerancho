// Listas del editor de entrenadores, sacadas de los datos del juego.

import { KANTO } from '../../../src/data/maps'
import { TRAINERS, TrainerId, TrainerLook } from '../../../src/data/trainers'
import { TRAINER_SPRITES } from '../../../src/ui/route/gym/trainerSprites'
import { kebab } from '../codegen'

export { TRAINERS }

/** Entrenadores del juego: [clave de TrainerId, valor] */
export const TRAINER_ENTRIES: [string, string][] = Object.entries(TrainerId)

export const isNewTrainer = (key: string) => !(key in TrainerId)

export const trainerIdOf = (idKey: string, idValue: string) => idValue || kebab(idKey)

/** Aspectos para elegir: [clave de TrainerLook, imagen] */
export const LOOKS: [string, string][] = Object.entries(TrainerLook).map(([k, v]) => [k, TRAINER_SPRITES[v]])

/** Paradas del mapa en las que sale el entrenador con ese valor de TrainerId: «S. S. Anne › Salón de baile» */
export function trainerStops(value: string): string[] {
  return KANTO.routes.flatMap((r) => r.nodes.filter((n) => n.trainer === value).map((n) => `${r.name} › ${n.name}`))
}

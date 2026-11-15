// Listas del editor de entrenadores, sacadas de los datos del juego.

import { KANTO } from '../../../src/data/maps'
import { TRAINER_CLASSES } from '../../../src/data/trainerClasses'
import { TRAINER_NAMES } from '../../../src/data/trainerNames'
import { Gender, TRAINERS, TrainerClass, TrainerId, TrainerName } from '../../../src/data/trainers'
import { classGenders } from '../../../src/game/run/trainerIdentity'
import { TRAINER_SPRITES } from '../../../src/ui/route/gym/trainerSprites'

export { TRAINERS }

/** Claves de los entrenadores del juego (cada una es su TrainerId) */
export const TRAINER_KEYS = Object.keys(TrainerId) as TrainerId[]

export const isNewTrainer = (key: string) => !(key in TrainerId)

/** Una clase para elegir: su clave, sus títulos («Nadador / Nadadora») y el dibujo de cada género */
export interface ClassTile {
  key: string
  titles: string
  images: string[]
}

export const CLASS_TILES: ClassTile[] = Object.entries(TrainerClass).map(([key, value]) => {
  const styles = classGenders(value).map((g) => TRAINER_CLASSES[value][g]!)
  return { key, titles: [...new Set(styles.map((s) => s.title))].join(' / '), images: styles.map((s) => TRAINER_SPRITES[s.look]) }
})

const GENDER_TEXT: Record<Gender, string> = { [Gender.Male]: 'chico', [Gender.Female]: 'chica' }

/** Nombres para el desplegable: [clave de TrainerName, «Lucía (chica)»] */
export const NAME_OPTIONS: [string, string][] = Object.entries(TrainerName).map(([k, v]) => [
  k,
  `${TRAINER_NAMES[v].name} (${GENDER_TEXT[TRAINER_NAMES[v].gender]})`,
])

/** Géneros para el desplegable: [clave de Gender, texto] */
export const GENDER_OPTIONS: [string, string][] = Object.entries(Gender).map(([k, v]) => [k, GENDER_TEXT[v]])

/** Títulos de la clase con esa clave de TrainerClass: «Joven / Chica» */
export const classTitles = (key: string): string => CLASS_TILES.find((c) => c.key === key)?.titles ?? key

/** Paradas del mapa en las que sale el entrenador con ese TrainerId: «S. S. Anne › Salón de baile» */
export function trainerStops(value: string): string[] {
  return KANTO.routes.flatMap((r) => r.nodes.filter((n) => n.trainer === value).map((n) => `${r.name} › ${n.name}`))
}

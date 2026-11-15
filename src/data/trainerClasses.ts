// Clases de entrenador (Nadador, Cazabichos…): qué géneros tiene y, según el género, cómo se llama y qué dibujo lleva.
// Un entrenador de trainers.ts elige su clase y en cada ruta le toca un género de ella y un nombre de ese género
// (trainerNames.ts): «Nadadora Lucía».
// Este fichero es para editarlo a mano; la imagen de cada aspecto, en ui/route/gym/trainerSprites.ts.

export const Gender = { Male: 'male', Female: 'female' } as const
export type Gender = (typeof Gender)[keyof typeof Gender]

/** Aspecto del entrenador: qué dibujo se ve detrás de su Pokémon */
export const TrainerLook = {
  Sailor: 'sailor',
  RocketGruntM: 'rocket-grunt-m',
  RocketGruntF: 'rocket-grunt-f',
  Giovanni: 'giovanni',
  BugCatcher: 'bug-catcher',
  Youngster: 'youngster',
  Lass: 'lass',
  Picnicker: 'picnicker',
  Camper: 'camper',
  Hiker: 'hiker',
  Fisherman: 'fisherman',
  SwimmerM: 'swimmer-m',
  SwimmerF: 'swimmer-f',
  BirdKeeper: 'bird-keeper',
  BlackBelt: 'black-belt',
} as const
export type TrainerLook = (typeof TrainerLook)[keyof typeof TrainerLook]

export const TrainerClass = {
  Sailor: 'sailor',
  RocketGrunt: 'rocket-grunt',
  RocketBoss: 'rocket-boss',
  Giovanni: 'giovanni',
  BugCatcher: 'bug-catcher',
  Youngster: 'youngster',
  Camper: 'camper',
  Hiker: 'hiker',
  Fisherman: 'fisherman',
  Swimmer: 'swimmer',
  BirdKeeper: 'bird-keeper',
  BlackBelt: 'black-belt',
} as const
export type TrainerClass = (typeof TrainerClass)[keyof typeof TrainerClass]

/** Cómo se ve un entrenador de esa clase y género */
export interface ClassStyle {
  /** Título delante del nombre: «Nadadora» */
  title: string
  look: TrainerLook
}

/** Cada clase, con los géneros que tiene: un nombre de otro género no vale para ella (lo comprueba trainers.test.ts) */
export const TRAINER_CLASSES: Record<TrainerClass, Partial<Record<Gender, ClassStyle>>> = {
  [TrainerClass.Sailor]: { male: { title: 'Marinero', look: TrainerLook.Sailor } },
  [TrainerClass.RocketGrunt]: {
    male: { title: 'Recluta Rocket', look: TrainerLook.RocketGruntM },
    female: { title: 'Recluta Rocket', look: TrainerLook.RocketGruntF },
  },
  [TrainerClass.RocketBoss]: { male: { title: 'Jefe Rocket', look: TrainerLook.RocketGruntM } },
  [TrainerClass.Giovanni]: { male: { title: 'Giovanni', look: TrainerLook.Giovanni } },
  [TrainerClass.BugCatcher]: { male: { title: 'Cazabichos', look: TrainerLook.BugCatcher } },
  [TrainerClass.Youngster]: {
    male: { title: 'Joven', look: TrainerLook.Youngster },
    female: { title: 'Chica', look: TrainerLook.Lass },
  },
  [TrainerClass.Camper]: {
    male: { title: 'Campista', look: TrainerLook.Camper },
    female: { title: 'Dominguera', look: TrainerLook.Picnicker },
  },
  [TrainerClass.Hiker]: { male: { title: 'Montañero', look: TrainerLook.Hiker } },
  [TrainerClass.Fisherman]: { male: { title: 'Pescador', look: TrainerLook.Fisherman } },
  [TrainerClass.Swimmer]: {
    male: { title: 'Nadador', look: TrainerLook.SwimmerM },
    female: { title: 'Nadadora', look: TrainerLook.SwimmerF },
  },
  [TrainerClass.BirdKeeper]: { male: { title: 'Ornitólogo', look: TrainerLook.BirdKeeper } },
  [TrainerClass.BlackBelt]: { male: { title: 'Karateka', look: TrainerLook.BlackBelt } },
}

/** Clases que nunca llevan nombre: se ven solo con el título («Recluta Rocket», «Giovanni») */
export const NAMELESS_CLASSES: readonly TrainerClass[] = [TrainerClass.RocketGrunt, TrainerClass.RocketBoss, TrainerClass.Giovanni]

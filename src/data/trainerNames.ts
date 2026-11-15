import { Gender } from './trainerClasses'

// Nombres para los entrenadores de trainers.ts, con su género: el género decide el título y el dibujo de su clase
// («Nadador Pablo», «Nadadora Lucía»). Este fichero es para editarlo a mano.

export const TrainerName = {
  Pablo: 'pablo',
  Ruben: 'ruben',
  Marcos: 'marcos',
  Tomas: 'tomas',
  Luis: 'luis',
  Paco: 'paco',
  Jose: 'jose',
  Iker: 'iker',
  Mario: 'mario',
  Kenji: 'kenji',
  Dani: 'dani',
  Hugo: 'hugo',
  Sergio: 'sergio',
  Alvaro: 'alvaro',
  Lucia: 'lucia',
  Laura: 'laura',
  Ana: 'ana',
  Sara: 'sara',
  Nerea: 'nerea',
  Carla: 'carla',
  Alba: 'alba',
  Irene: 'irene',
  Marta: 'marta',
  Elena: 'elena',
} as const
export type TrainerName = (typeof TrainerName)[keyof typeof TrainerName]

export interface NameInfo {
  /** Tal y como se ve: «Lucía» */
  name: string
  gender: Gender
}

const male = (name: string): NameInfo => ({ name, gender: Gender.Male })
const female = (name: string): NameInfo => ({ name, gender: Gender.Female })

export const TRAINER_NAMES: Record<TrainerName, NameInfo> = {
  [TrainerName.Pablo]: male('Pablo'),
  [TrainerName.Ruben]: male('Rubén'),
  [TrainerName.Marcos]: male('Marcos'),
  [TrainerName.Tomas]: male('Tomás'),
  [TrainerName.Luis]: male('Luis'),
  [TrainerName.Paco]: male('Paco'),
  [TrainerName.Jose]: male('José'),
  [TrainerName.Iker]: male('Iker'),
  [TrainerName.Mario]: male('Mario'),
  [TrainerName.Kenji]: male('Kenji'),
  [TrainerName.Dani]: male('Dani'),
  [TrainerName.Hugo]: male('Hugo'),
  [TrainerName.Sergio]: male('Sergio'),
  [TrainerName.Alvaro]: male('Álvaro'),
  [TrainerName.Lucia]: female('Lucía'),
  [TrainerName.Laura]: female('Laura'),
  [TrainerName.Ana]: female('Ana'),
  [TrainerName.Sara]: female('Sara'),
  [TrainerName.Nerea]: female('Nerea'),
  [TrainerName.Carla]: female('Carla'),
  [TrainerName.Alba]: female('Alba'),
  [TrainerName.Irene]: female('Irene'),
  [TrainerName.Marta]: female('Marta'),
  [TrainerName.Elena]: female('Elena'),
}

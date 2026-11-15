import { NAMELESS_CLASSES, TRAINER_CLASSES, type ClassStyle, type Gender, type TrainerClass } from '../../data/trainerClasses'
import { TRAINER_NAMES, TrainerName, type NameInfo } from '../../data/trainerNames'
import type { Trainer } from '../../data/trainers'
import type { Rng } from '../core/random'

// Quién es un entrenador de ruta: su clase da los géneros posibles y, según el género, el título y el dibujo; en cada
// ruta le toca un género de su clase y un nombre de ese género al azar (salvo que los lleve fijos).

/** Quién le ha tocado ser en esta ruta (se guarda en la ruta en curso, ver runTrainer.ts) */
export interface TrainerWho {
  gender: Gender
  /** Sin él, solo el título («Recluta Rocket») */
  name?: TrainerName
}

/** Lo que se ve de un entrenador: «Nadadora Lucía» y su dibujo */
export interface TrainerIdentity extends ClassStyle {
  /** Título y nombre: «Nadadora Lucía» (o solo «Nadador» si no lleva nombre) */
  name: string
}

type Who = Pick<Trainer, 'trainerClass' | 'name' | 'gender'>

const pickOne = <T>(list: readonly T[], rng: Rng): T => list[Math.floor(rng() * list.length)]

/** Géneros que tiene la clase, en el orden en que están escritos */
export const classGenders = (c: TrainerClass): Gender[] => Object.keys(TRAINER_CLASSES[c]) as Gender[]

/** Nombres de ese género */
export const namesOf = (g: Gender): TrainerName[] => Object.values(TrainerName).filter((n) => TRAINER_NAMES[n].gender === g)

/** Género fijo del entrenador: el de su nombre fijo, el suyo o el primero de su clase */
const fixedGender = (t: Who): Gender => (t.name && TRAINER_NAMES[t.name].gender) || t.gender || classGenders(t.trainerClass)[0]

/** ¿Tiene su clase el género fijo que lleva? (si no, se vería con el primero de la clase) */
export const fitsClass = (t: Who): boolean => classGenders(t.trainerClass).includes(fixedGender(t))

/** Quién es en esta ruta: lo fijo que lleve y, lo demás, al azar (un género de su clase y un nombre de ese género) */
export function pickTrainerWho(t: Who, rng: Rng): TrainerWho {
  if (t.name) return { gender: TRAINER_NAMES[t.name].gender, name: t.name }
  const gender = t.gender ?? pickOne(classGenders(t.trainerClass), rng)
  const names = NAMELESS_CLASSES.includes(t.trainerClass) ? [] : namesOf(gender)
  return names.length ? { gender, name: pickOne(names, rng) } : { gender }
}

/** Sin ruta (editor, herramientas): su nombre fijo o solo el título, con su género fijo */
export const fixedWho = (t: Who): TrainerWho => ({ gender: fixedGender(t), name: t.name })

export function trainerIdentity(t: Pick<Trainer, 'trainerClass'>, who: TrainerWho): TrainerIdentity {
  const styles = TRAINER_CLASSES[t.trainerClass]
  const style = styles[who.gender] ?? styles[classGenders(t.trainerClass)[0]]!
  // Un nombre guardado que ya no esté en la lista se queda en el título
  const given = who.name && (TRAINER_NAMES as Partial<Record<string, NameInfo>>)[who.name]?.name
  return { ...style, name: given ? `${style.title} ${given}` : style.title }
}

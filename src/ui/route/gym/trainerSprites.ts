import { TrainerLook } from '../../../data/trainers'
import giovanni from '../../../assets/trainers/giovanni.gif'
import sailor from '../../../assets/trainers/sailor.png'
import rocketGruntM from '../../../assets/trainers/rocket-grunt-m.png'
import rocketGruntF from '../../../assets/trainers/rocket-grunt-f.png'

/**
 * Dibujo de cada aspecto de entrenador (de WikiDex, los de Oro HeartGold y Plata SoulSilver): GIF animado si lo hay
 * (Giovanni, como los líderes) y, si no, la imagen fija de su clase de entrenador
 */
export const TRAINER_SPRITES: Record<TrainerLook, string> = {
  [TrainerLook.Sailor]: sailor,
  [TrainerLook.RocketGruntM]: rocketGruntM,
  [TrainerLook.RocketGruntF]: rocketGruntF,
  [TrainerLook.Giovanni]: giovanni,
}

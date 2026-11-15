import { TrainerLook, type Trainer } from '../../../data/trainers'
import { fixedWho, trainerIdentity, type TrainerWho } from '../../../game/run/trainerIdentity'
import giovanni from '../../../assets/trainers/giovanni.gif'
import sailor from '../../../assets/trainers/sailor.png'
import rocketGruntM from '../../../assets/trainers/rocket-grunt-m.png'
import rocketGruntF from '../../../assets/trainers/rocket-grunt-f.png'
import bugCatcher from '../../../assets/trainers/bug-catcher.png'
import youngster from '../../../assets/trainers/youngster.png'
import lass from '../../../assets/trainers/lass.png'
import picnicker from '../../../assets/trainers/picnicker.png'
import camper from '../../../assets/trainers/camper.png'
import hiker from '../../../assets/trainers/hiker.png'
import fisherman from '../../../assets/trainers/fisherman.png'
import swimmerM from '../../../assets/trainers/swimmer-m.png'
import swimmerF from '../../../assets/trainers/swimmer-f.png'
import birdKeeper from '../../../assets/trainers/bird-keeper.png'
import blackBelt from '../../../assets/trainers/black-belt.png'

/**
 * Dibujo de cada aspecto de entrenador (de WikiDex, los de Oro HeartGold y Plata SoulSilver): GIF animado si lo hay
 * (Giovanni, como los líderes) y, si no, la imagen fija de su clase de entrenador
 */
export const TRAINER_SPRITES: Record<TrainerLook, string> = {
  [TrainerLook.Sailor]: sailor,
  [TrainerLook.RocketGruntM]: rocketGruntM,
  [TrainerLook.RocketGruntF]: rocketGruntF,
  [TrainerLook.Giovanni]: giovanni,
  [TrainerLook.BugCatcher]: bugCatcher,
  [TrainerLook.Youngster]: youngster,
  [TrainerLook.Lass]: lass,
  [TrainerLook.Picnicker]: picnicker,
  [TrainerLook.Camper]: camper,
  [TrainerLook.Hiker]: hiker,
  [TrainerLook.Fisherman]: fisherman,
  [TrainerLook.SwimmerM]: swimmerM,
  [TrainerLook.SwimmerF]: swimmerF,
  [TrainerLook.BirdKeeper]: birdKeeper,
  [TrainerLook.BlackBelt]: blackBelt,
}

/** Nombre («Nadadora Lucía») y dibujo de un entrenador: el que le ha tocado en la ruta o, sin ruta, lo que lleve fijo */
export function trainerPortrait(t: Trainer, who: TrainerWho = fixedWho(t)): { name: string; sprite: string } {
  const { name, look } = trainerIdentity(t, who)
  return { name, sprite: TRAINER_SPRITES[look] }
}

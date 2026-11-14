import type { GymFoe } from './gyms'
import { IMOVE } from './incursionMoves'
import { POKEMON } from './pokemon'

// Entrenadores de las paradas de entrenador (`NodeKind.Trainer`, ver kantoMaps.ts): sacan su equipo uno tras otro,
// como un líder de gimnasio, y cada Pokémon suyo da más EXP (ver game/run/runTrainer.ts). Este fichero es para
// editarlo a mano; la imagen de cada aspecto, en ui/route/gym/trainerSprites.ts.

/** Aspecto del entrenador: qué dibujo se ve detrás de su Pokémon */
export const TrainerLook = { Sailor: 'sailor', RocketGruntM: 'rocket-grunt-m', RocketGruntF: 'rocket-grunt-f', Giovanni: 'giovanni' } as const
export type TrainerLook = (typeof TrainerLook)[keyof typeof TrainerLook]

export const TrainerId = {
  MarineroDani: 'marinero-dani',
  MarineroHugo: 'marinero-hugo',
  ReclutaRocketSalon: 'recluta-rocket-salon',
  ReclutaRocketCapitan: 'recluta-rocket-capitan',
  JefeRocketBodega: 'jefe-rocket-bodega',
  Giovanni: 'giovanni',
} as const
export type TrainerId = (typeof TrainerId)[keyof typeof TrainerId]

export interface Trainer {
  /** Nombre tal y como se ve («Marinero Dani») */
  name: string
  look: TrainerLook
  /** Su equipo, en el orden en que los saca; cada uno con su `statMult` (sin él, 1) y, si se quiere, sus ataques */
  team: GymFoe[]
}

export const TRAINERS: Record<TrainerId, Trainer> = {
  [TrainerId.MarineroDani]: {
    name: 'Marinero Dani',
    look: TrainerLook.Sailor,
    team: [
      { speciesId: POKEMON.Machop, level: 52, statMult: 1.1 },
      { speciesId: POKEMON.Tentacool, level: 53, statMult: 1.2 },
    ],
  },
  [TrainerId.ReclutaRocketSalon]: {
    name: 'Recluta Rocket',
    look: TrainerLook.RocketGruntM,
    team: [
      { speciesId: POKEMON.Koffing, level: 52, statMult: 1.1 },
      { speciesId: POKEMON.Weezing, level: 54, statMult: 1.3 },
    ],
  },
  [TrainerId.MarineroHugo]: {
    name: 'Marinero Hugo',
    look: TrainerLook.Sailor,
    team: [
      { speciesId: POKEMON.Horsea, level: 53, statMult: 1.2 },
      { speciesId: POKEMON.Shellder, level: 54, statMult: 1.3 },
      { speciesId: POKEMON.Wartortle, level: 54, statMult: 1.3 },
    ],
  },
  [TrainerId.ReclutaRocketCapitan]: {
    name: 'Recluta Rocket',
    look: TrainerLook.RocketGruntF,
    team: [
      { speciesId: POKEMON.Zubat, level: 54, statMult: 1.3 },
      { speciesId: POKEMON.Arbok, level: 56, statMult: 1.3 },
    ],
  },
  // Ejemplo completo: cada Pokémon con nivel, multiplicador de stats, pasivas de tipo y ataques de incursión
  [TrainerId.JefeRocketBodega]: {
    name: 'Jefe Rocket',
    look: TrainerLook.RocketGruntM,
    team: [
      {
        speciesId: POKEMON.Kangaskhan,
        level: 58,
        statMult: 2,
        passives: [{ type: 'normal', level: 2 }],
        moves: [IMOVE.Megapuno.id, IMOVE.PunoMareo.id],
      },
    ],
  },
  [TrainerId.Giovanni]: {
    name: 'Giovanni',
    look: TrainerLook.Giovanni,
    team: [
      { speciesId: POKEMON.Golbat, level: 55, statMult: 1 },
      { speciesId: POKEMON.Arcanine, level: 56, statMult: 1.2 },
      {
        speciesId: POKEMON.Kartana,
        level: 58,
        statMult: 1.5,
        passives: [{ type: 'fighting', level: 2 }],
        moves: [IMOVE.GarraBrutal.id, IMOVE.EspadaMistica.id],
      },
    ],
  },
}

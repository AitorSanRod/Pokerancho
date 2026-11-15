import type { GymFoe } from './gyms'
import { IMOVE } from './incursionMoves'
import { POKEMON } from './pokemon'

// Entrenadores de las paradas de entrenador (`NodeKind.Trainer`, ver kantoMaps.ts): sacan su equipo uno tras otro,
// como un líder de gimnasio, y cada Pokémon suyo da más EXP (ver game/run/runTrainer.ts). Este fichero es para
// editarlo a mano; la imagen de cada aspecto, en ui/route/gym/trainerSprites.ts.

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

export const TrainerId = {
  MarineroDani: 'marinero-dani',
  MarineroHugo: 'marinero-hugo',
  ReclutaRocketSalon: 'recluta-rocket-salon',
  ReclutaRocketCapitan: 'recluta-rocket-capitan',
  JefeRocketBodega: 'jefe-rocket-bodega',
  Giovanni: 'giovanni',
  CazabichosTomas: 'cazabichos-tomas',
  CazabichosLuis: 'cazabichos-luis',
  JovenRuben: 'joven-ruben',
  JovenMarcos: 'joven-marcos',
  ChicaLaura: 'chica-laura',
  ChicaAna: 'chica-ana',
  DomingueraSara: 'dominguera-sara',
  CampistaPablo: 'campista-pablo',
  MontaneroPaco: 'montanero-paco',
  PescadorJose: 'pescador-jose',
  NadadorIker: 'nadador-iker',
  NadadoraLucia: 'nadadora-lucia',
  OrnitologoMario: 'ornitologo-mario',
  KaratekaKenji: 'karateka-kenji',
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
  // Entrenadores base, de nivel bajo a medio, para las paradas de entrenador de las rutas
  [TrainerId.CazabichosTomas]: {
    name: 'Cazabichos Tomás',
    look: TrainerLook.BugCatcher,
    team: [
      { speciesId: POKEMON.Caterpie, level: 6 },
      { speciesId: POKEMON.Weedle, level: 6 },
      { speciesId: POKEMON.Caterpie, level: 7 },
    ],
  },
  [TrainerId.CazabichosLuis]: {
    name: 'Cazabichos Luis',
    look: TrainerLook.BugCatcher,
    team: [
      { speciesId: POKEMON.Metapod, level: 10 },
      { speciesId: POKEMON.Kakuna, level: 10 },
      { speciesId: POKEMON.Paras, level: 12 },
    ],
  },
  [TrainerId.JovenRuben]: {
    name: 'Joven Rubén',
    look: TrainerLook.Youngster,
    team: [
      { speciesId: POKEMON.Pidgey, level: 6 }
    ],
  },
  [TrainerId.JovenMarcos]: {
    name: 'Joven Marcos',
    look: TrainerLook.Youngster,
    team: [
      { speciesId: POKEMON.Rattata, level: 14 },
      { speciesId: POKEMON.Ekans, level: 15 },
      { speciesId: POKEMON.Sandshrew, level: 15 },
    ],
  },
  [TrainerId.ChicaLaura]: {
    name: 'Chica Laura',
    look: TrainerLook.Lass,
    team: [
      { speciesId: POKEMON.Pidgey, level: 9 },
      { speciesId: POKEMON.NidoranF, level: 10 },
    ],
  },
  [TrainerId.ChicaAna]: {
    name: 'Chica Ana',
    look: TrainerLook.Lass,
    team: [
      { speciesId: POKEMON.Jigglypuff, level: 16 },
      { speciesId: POKEMON.Clefairy, level: 17, statMult: 1.1 },
    ],
  },
  [TrainerId.DomingueraSara]: {
    name: 'Dominguera Sara',
    look: TrainerLook.Picnicker,
    team: [
      { speciesId: POKEMON.Oddish, level: 12 },
      { speciesId: POKEMON.Bellsprout, level: 12 },
      { speciesId: POKEMON.Pikachu, level: 13 },
    ],
  },
  [TrainerId.CampistaPablo]: {
    name: 'Campista Pablo',
    look: TrainerLook.Camper,
    team: [
      { speciesId: POKEMON.NidoranM, level: 13 },
      { speciesId: POKEMON.Mankey, level: 14 },
      { speciesId: POKEMON.Growlithe, level: 15, statMult: 1.1 },
    ],
  },
  [TrainerId.MontaneroPaco]: {
    name: 'Montañero Paco',
    look: TrainerLook.Hiker,
    team: [
      { speciesId: POKEMON.Geodude, level: 18 },
      { speciesId: POKEMON.Geodude, level: 18 },
      { speciesId: POKEMON.Onix, level: 20, statMult: 1.1 },
    ],
  },
  [TrainerId.PescadorJose]: {
    name: 'Pescador José',
    look: TrainerLook.Fisherman,
    team: [
      { speciesId: POKEMON.Magikarp, level: 15 },
      { speciesId: POKEMON.Magikarp, level: 15 },
      { speciesId: POKEMON.Goldeen, level: 17 },
      { speciesId: POKEMON.Poliwag, level: 17 },
    ],
  },
  [TrainerId.NadadorIker]: {
    name: 'Nadador Iker',
    look: TrainerLook.SwimmerM,
    team: [
      { speciesId: POKEMON.Tentacool, level: 22 },
      { speciesId: POKEMON.Horsea, level: 23 },
      { speciesId: POKEMON.Poliwhirl, level: 24, statMult: 1.1 },
    ],
  },
  [TrainerId.NadadoraLucia]: {
    name: 'Nadadora Lucía',
    look: TrainerLook.SwimmerF,
    team: [
      { speciesId: POKEMON.Staryu, level: 22 },
      { speciesId: POKEMON.Goldeen, level: 23 },
      { speciesId: POKEMON.Seel, level: 24, statMult: 1.1 },
    ],
  },
  [TrainerId.OrnitologoMario]: {
    name: 'Ornitólogo Mario',
    look: TrainerLook.BirdKeeper,
    team: [
      { speciesId: POKEMON.Pidgey, level: 20 },
      { speciesId: POKEMON.Spearow, level: 21 },
      { speciesId: POKEMON.Doduo, level: 22 },
      { speciesId: POKEMON.Farfetchd, level: 23, statMult: 1.1 },
    ],
  },
  [TrainerId.KaratekaKenji]: {
    name: 'Karateka Kenji',
    look: TrainerLook.BlackBelt,
    team: [
      { speciesId: POKEMON.Machop, level: 26 },
      { speciesId: POKEMON.Mankey, level: 26 },
      { speciesId: POKEMON.Machoke, level: 28, statMult: 1.2 },
    ],
  },
}

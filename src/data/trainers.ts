import { Gender, TrainerClass } from './trainerClasses'
import { TrainerName } from './trainerNames'
import { IMOVE } from './incursionMoves'
import { POKEMON } from './pokemon'
import type { TrainerTeam } from './trainerTeam'

export { Gender, TrainerClass, TrainerLook } from './trainerClasses'
export { TrainerName } from './trainerNames'

// Entrenadores de las paradas de entrenador (`NodeKind.Trainer`, ver kantoMaps.ts): sacan su equipo uno tras otro,
// como un líder de gimnasio, y cada Pokémon suyo da más EXP (ver game/run/runTrainer.ts). Este fichero es para
// editarlo a mano: cada entrenador es una clave de TRAINERS (`Joven1: { … }`) y la parada lo nombra con
// `TrainerId.Joven1`. Lleva una clase genérica (trainerClasses.ts) y, en cada ruta, un nombre al azar de los de
// trainerNames.ts con un género de su clase: «Joven Rubén» o «Chica Laura» (ver game/run/trainerIdentity.ts).

export interface Trainer {
  /** Su clase: los géneros que puede tener y, según el género, el título y el dibujo */
  trainerClass: TrainerClass
  /** Nombre fijo («Marinero Dani»); sin él, uno al azar del género que le toque en cada ruta */
  name?: TrainerName
  /** Género fijo (si su clase tiene dos); sin él, el del nombre fijo o uno al azar de su clase */
  gender?: Gender
  /** Cada Pokémon con su `statMult` (sin él, 1) y, si se quiere, sus pasivas y ataques */
  team: TrainerTeam
}

/** Da a TRAINERS su tipo sin perder sus claves, que son los TrainerId */
const trainerList = <K extends string>(list: Record<K, Trainer>) => list

export const TRAINERS = trainerList({
  MarineroDani: {
    trainerClass: TrainerClass.Sailor,
    name: TrainerName.Dani,
    team: [
      { speciesId: POKEMON.Machop, level: 52, statMult: 1.1 },
      { speciesId: POKEMON.Tentacool, level: 53, statMult: 1.2 },
    ],
  },
  ReclutaRocketSalon: {
    trainerClass: TrainerClass.RocketGrunt,
    team: [
      { speciesId: POKEMON.Koffing, level: 52, statMult: 1.1 },
      { speciesId: POKEMON.Weezing, level: 54, statMult: 1.3 },
    ],
  },
  MarineroHugo: {
    trainerClass: TrainerClass.Sailor,
    name: TrainerName.Hugo,
    team: [
      { speciesId: POKEMON.Horsea, level: 53, statMult: 1.2 },
      { speciesId: POKEMON.Shellder, level: 54, statMult: 1.3 },
      { speciesId: POKEMON.Wartortle, level: 54, statMult: 1.3 },
    ],
  },
  ReclutaRocketCapitan: {
    trainerClass: TrainerClass.RocketGrunt,
    gender: Gender.Female,
    team: [
      { speciesId: POKEMON.Zubat, level: 54, statMult: 1.3 },
      { speciesId: POKEMON.Arbok, level: 56, statMult: 1.3 },
    ],
  },
  // Ejemplo completo: cada Pokémon con nivel, multiplicador de stats, pasivas de tipo y ataques de incursión
  JefeRocketBodega: {
    trainerClass: TrainerClass.RocketBoss,
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
  Giovanni: {
    trainerClass: TrainerClass.Giovanni,
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
  // Entrenadores base, de nivel bajo a medio: sin nombre fijo, cada vez uno al azar (y el género, si su clase tiene dos)
  Cazabichos1: {
    trainerClass: TrainerClass.BugCatcher,
    team: [
      { speciesId: POKEMON.Caterpie, level: 6 },
      { speciesId: POKEMON.Weedle, level: 6 },
      { speciesId: POKEMON.Caterpie, level: 7 },
    ],
  },
  Cazabichos2: {
    trainerClass: TrainerClass.BugCatcher,
    team: [
      { speciesId: POKEMON.Metapod, level: 10 },
      { speciesId: POKEMON.Kakuna, level: 12 },
    ],
  },
  Joven1: {
    trainerClass: TrainerClass.Youngster,
    team: [
      { speciesId: POKEMON.Rattata, level: 8 },
      { speciesId: POKEMON.Spearow, level: 9 },
    ],
  },
  Joven2: {
    trainerClass: TrainerClass.Youngster,
    team: [
      { speciesId: POKEMON.Rattata, level: 14 },
      { speciesId: POKEMON.Ekans, level: 15 },
      { speciesId: POKEMON.Sandshrew, level: 15 },
    ],
  },
  Joven3: {
    trainerClass: TrainerClass.Youngster,
    team: [
      { speciesId: POKEMON.Pidgey, level: 9 },
      { speciesId: POKEMON.NidoranF, level: 10 },
    ],
  },
  Joven4: {
    trainerClass: TrainerClass.Youngster,
    team: [
      { speciesId: POKEMON.Jigglypuff, level: 16 },
      { speciesId: POKEMON.Clefairy, level: 17, statMult: 1.1 },
    ],
  },
  Joven5: {
    trainerClass: TrainerClass.Youngster,
    team: [
      { speciesId: POKEMON.Rattata, level: 55, statMult: 1.5 },
      { speciesId: POKEMON.Clefairy, level: 58, statMult: 1.3 },
    ],
  },
  Campista1: {
    trainerClass: TrainerClass.Camper,
    team: [
      { speciesId: POKEMON.Oddish, level: 12 },
      { speciesId: POKEMON.Bellsprout, level: 12 },
      { speciesId: POKEMON.Pikachu, level: 13 },
    ],
  },
  Campista2: {
    trainerClass: TrainerClass.Camper,
    team: [
      { speciesId: POKEMON.NidoranM, level: 13 },
      { speciesId: POKEMON.Mankey, level: 14 },
      { speciesId: POKEMON.Growlithe, level: 15, statMult: 1.1 },
    ],
  },
  Montanero1: {
    trainerClass: TrainerClass.Hiker,
    team: [
      { speciesId: POKEMON.Geodude, level: 18 },
      { speciesId: POKEMON.Geodude, level: 18 },
      { speciesId: POKEMON.Onix, level: 20, statMult: 1.1 },
    ],
  },
  Montanero2: {
    trainerClass: TrainerClass.Hiker,
    team: [
      { speciesId: POKEMON.Tauros, level: 60, statMult: 1.2 },
      { speciesId: POKEMON.Graveler, level: 62 },
      { speciesId: POKEMON.Onix, level: 62, statMult: 2 },
    ],
  },
  Pescador1: {
    trainerClass: TrainerClass.Fisherman,
    team: [
      { speciesId: POKEMON.Magikarp, level: 15 },
      { speciesId: POKEMON.Magikarp, level: 15 },
      { speciesId: POKEMON.Goldeen, level: 17 },
      { speciesId: POKEMON.Poliwag, level: 17 },
    ],
  },
  Nadador1: {
    trainerClass: TrainerClass.Swimmer,
    team: [
      { speciesId: POKEMON.Tentacool, level: 22 },
      { speciesId: POKEMON.Horsea, level: 23 },
      { speciesId: POKEMON.Poliwhirl, level: 24, statMult: 1.1 },
    ],
  },
  Nadador2: {
    trainerClass: TrainerClass.Swimmer,
    team: [
      { speciesId: POKEMON.Staryu, level: 22 },
      { speciesId: POKEMON.Goldeen, level: 23 },
      { speciesId: POKEMON.Seel, level: 24, statMult: 1.1 },
    ],
  },
  Ornitologo1: {
    trainerClass: TrainerClass.BirdKeeper,
    team: [
      { speciesId: POKEMON.Pidgey, level: 20 },
      { speciesId: POKEMON.Spearow, level: 21 },
      { speciesId: POKEMON.Doduo, level: 22 },
      { speciesId: POKEMON.Farfetchd, level: 23, statMult: 1.1 },
    ],
  },
  // Monte Moon: cada uno saca un Pokémon de calentamiento y, después, su especialista con la pasiva de su tipo
  CampistaMonteMoon: {
    trainerClass: TrainerClass.Camper,
    gender: Gender.Male,
    team: [
      { speciesId: POKEMON.Ponyta, level: 33 },
      { speciesId: POKEMON.Growlithe, level: 36, passives: [{ type: 'fire', level: 2 }] },
    ],
  },
  PescadorMonteMoon: {
    trainerClass: TrainerClass.Fisherman,
    team: [
      { speciesId: POKEMON.Goldeen, level: 33 },
      { speciesId: POKEMON.Poliwhirl, level: 36, passives: [{ type: 'water', level: 2 }] },
    ],
  },
  DomingueraMonteMoon: {
    trainerClass: TrainerClass.Camper,
    gender: Gender.Female,
    team: [
      { speciesId: POKEMON.Weepinbell, level: 33 },
      { speciesId: POKEMON.Victreebel, level: 36, passives: [{ type: 'grass', level: 2 }] },
    ],
  },
  MontaneroTunel: {
    trainerClass: TrainerClass.Hiker,
    team: [
      { speciesId: POKEMON.Graveler, level: 57, statMult: 1.1 },
      { speciesId: POKEMON.Onix, level: 58, statMult: 1.3 },
      { speciesId: POKEMON.Golem, level: 59, statMult: 1.3, passives: [{ type: 'rock', level: 2 }] },
    ],
  },
  // De Azulona a la Liga
  ReclutaRocketTorre: {
    trainerClass: TrainerClass.RocketGrunt,
    team: [
      { speciesId: POKEMON.Golbat, level: 68, statMult: 1.3 },
      { speciesId: POKEMON.Arbok, level: 69, statMult: 1.3 },
      { speciesId: POKEMON.Weezing, level: 70, statMult: 1.4 },
    ],
  },
  PescadorRuta12: {
    trainerClass: TrainerClass.Fisherman,
    team: [
      { speciesId: POKEMON.Seaking, level: 69, statMult: 1.3 },
      { speciesId: POKEMON.Kingler, level: 70, statMult: 1.3 },
      { speciesId: POKEMON.Gyarados, level: 71, statMult: 1.5 },
    ],
  },
  OrnitologoCiclovia: {
    trainerClass: TrainerClass.BirdKeeper,
    team: [
      { speciesId: POKEMON.Fearow, level: 70, statMult: 1.3 },
      { speciesId: POKEMON.Dodrio, level: 71, statMult: 1.4 },
      { speciesId: POKEMON.Pidgeot, level: 72, statMult: 1.5 },
    ],
  },
  CampistaSafari: {
    trainerClass: TrainerClass.Camper,
    team: [
      { speciesId: POKEMON.Rhyhorn, level: 72, statMult: 1.3 },
      { speciesId: POKEMON.Exeggcute, level: 72, statMult: 1.3 },
      { speciesId: POKEMON.Nidorino, level: 73, statMult: 1.4 },
    ],
  },
  ReclutaRocketSilph1: {
    trainerClass: TrainerClass.RocketGrunt,
    gender: Gender.Male,
    team: [
      { speciesId: POKEMON.Raticate, level: 76, statMult: 1.4 },
      { speciesId: POKEMON.Golbat, level: 76, statMult: 1.4 },
      { speciesId: POKEMON.Hypno, level: 77, statMult: 1.5 },
    ],
  },
  ReclutaRocketSilph2: {
    trainerClass: TrainerClass.RocketGrunt,
    gender: Gender.Female,
    team: [
      { speciesId: POKEMON.Arbok, level: 77, statMult: 1.4 },
      { speciesId: POKEMON.Weezing, level: 78, statMult: 1.5 },
    ],
  },
  GiovanniSilph: {
    trainerClass: TrainerClass.Giovanni,
    team: [
      { speciesId: POKEMON.Nidorino, level: 77, statMult: 1.5 },
      { speciesId: POKEMON.Kangaskhan, level: 78, statMult: 1.6, passives: [{ type: 'normal', level: 2 }] },
      { speciesId: POKEMON.Rhyhorn, level: 78, statMult: 1.6 },
      { speciesId: POKEMON.Nidoqueen, level: 79, statMult: 1.8, passives: [{ type: 'ground', level: 2 }] },
    ],
  },
  NadadorEspuma: {
    trainerClass: TrainerClass.Swimmer,
    gender: Gender.Male,
    team: [
      { speciesId: POKEMON.Seadra, level: 81, statMult: 1.4 },
      { speciesId: POKEMON.Starmie, level: 82, statMult: 1.5 },
    ],
  },
  NadadoraEspuma: {
    trainerClass: TrainerClass.Swimmer,
    gender: Gender.Female,
    team: [
      { speciesId: POKEMON.Dewgong, level: 82, statMult: 1.5 },
      { speciesId: POKEMON.Cloyster, level: 83, statMult: 1.6 },
    ],
  },
  MontaneroCanela: {
    trainerClass: TrainerClass.Hiker,
    team: [
      { speciesId: POKEMON.Graveler, level: 84, statMult: 1.5 },
      { speciesId: POKEMON.Golem, level: 85, statMult: 1.6 },
      { speciesId: POKEMON.Rhydon, level: 86, statMult: 1.7 },
    ],
  },
  KaratekaVictoria: {
    trainerClass: TrainerClass.BlackBelt,
    team: [
      { speciesId: POKEMON.Hitmonchan, level: 91, statMult: 1.6 },
      { speciesId: POKEMON.Machoke, level: 91, statMult: 1.6 },
      { speciesId: POKEMON.Machamp, level: 92, statMult: 1.8, passives: [{ type: 'fighting', level: 2 }] },
    ],
  },
  MontaneroVictoria: {
    trainerClass: TrainerClass.Hiker,
    team: [
      { speciesId: POKEMON.Onix, level: 92, statMult: 1.6 },
      { speciesId: POKEMON.Golem, level: 93, statMult: 1.7 },
      { speciesId: POKEMON.Rhydon, level: 94, statMult: 1.8, passives: [{ type: 'rock', level: 2 }] },
    ],
  },
  Karateka1: {
    trainerClass: TrainerClass.BlackBelt,
    team: [
      { speciesId: POKEMON.Machop, level: 26 },
      { speciesId: POKEMON.Mankey, level: 26 },
      { speciesId: POKEMON.Machoke, level: 28, statMult: 1.2 },
    ],
  },
})

export type TrainerId = keyof typeof TRAINERS

/** Cada entrenador por su clave, para las paradas de kantoMaps.ts: `TrainerId.Joven1` */
export const TrainerId = Object.fromEntries(Object.keys(TRAINERS).map((k) => [k, k])) as { readonly [K in TrainerId]: K }

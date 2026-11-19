import { Badge } from './badges'
import { IMOVE } from './incursionMoves'
import { POKEMON } from './pokemon'
import type { TrainerTeam } from './trainerTeam'
import type { PokeType } from './types'
import { ELITE_FOUR } from './eliteFour'

// Gimnasios: el líder y su equipo, que saca uno tras otro en la parada de gimnasio (`NodeKind.Gym`) de su ruta
// (kantoMaps.ts). Este fichero es para editarlo a mano. Ganar al último da la medalla la primera vez (ver
// game/run/runGym.ts). El dibujo de cada líder, en ui/route/gym/leaderSprites.ts (sin él, se juega sin verlo). El Alto
// Mando y el Campeón, en eliteFour.ts.

export const GymId = {
  Plateada: 'plateada',
  Celeste: 'celeste',
  CiudadCarmin: 'ciudad-carmin',
  Azulona: 'azulona',
  Fucsia: 'fucsia',
  Azafran: 'azafran',
  Canela: 'canela',
  Verde: 'verde',
  // Alto Mando y Campeón (eliteFour.ts): sin medalla
  Lorelei: 'lorelei',
  Bruno: 'bruno',
  Agatha: 'agatha',
  Lance: 'lance',
  Campeon: 'campeon',
} as const
export type GymId = (typeof GymId)[keyof typeof GymId]

export interface Gym {
  /** Nombre del líder, tal y como se ve */
  leader: string
  /** Medalla que da ganarle la primera vez; sin ella, no da ninguna (el Alto Mando y el Campeón) */
  badge?: Badge
  /** Tipo en el que está especializado: da el fondo de su combate (ui/route/gymScenery.ts) */
  type: PokeType
  /** Nivel máximo para entrar: un Pokémon por encima no puede empezar su ruta (subir de nivel dentro no lo echa) */
  maxLevel: number
  team: TrainerTeam
}

export const GYMS: Record<GymId, Gym> = {
  [GymId.Plateada]: {
    leader: 'Brock',
    type: 'rock',
    badge: Badge.Boulder,
    maxLevel: 30,
    team: [
      { speciesId: POKEMON.Geodude, level: 20, passives: [{ type: 'rock', level: 1 }] },
      { speciesId: POKEMON.Onix, level: 23, passives: [{ type: 'rock', level: 2 }] },
    ],
  },
  [GymId.Celeste]: {
    leader: 'Misty',
    type: 'water',
    badge: Badge.Cascade,
    maxLevel: 50,
    team: [
      { speciesId: POKEMON.Staryu, level: 41, passives: [{ type: 'water', level: 2 }], statMult: 1.2, moves: [IMOVE.PistolaAgua.id, IMOVE.Buceo.id] },
      { speciesId: POKEMON.Starmie, level: 43, passives: [{ type: 'water', level: 2 }], statMult: 1.5, moves: [IMOVE.Confusion.id, IMOVE.Hidropulso.id]  },
    ],
  },
  [GymId.CiudadCarmin]: {
    leader: 'Lt. Surge',
    type: 'electric',
    badge: Badge.Thunder,
    maxLevel: 60,
    team: [
      { speciesId: POKEMON.Pikachu, level: 50, passives: [{ type: 'electric', level: 2 }], statMult: 1.4, moves: [IMOVE.PlacajeElectrico.id, IMOVE.VelocidadExtrema.id, IMOVE.Surf.id] },
      { speciesId: POKEMON.Raichu, level: 55, passives: [{ type: 'electric', level: 2 }, { type: 'ghost', level: 1 }], statMult: 1.8, moves: [IMOVE.Trueno.id, IMOVE.DobleFilo.id] },
    ],
  },
  [GymId.Azulona]: {
    leader: 'Erika',
    type: 'grass',
    badge: Badge.Rainbow,
    maxLevel: 75,
    team: [
      { speciesId: POKEMON.Victreebel, level: 66, statMult: 1.5, passives: [{ type: 'grass', level: 2 }] },
      { speciesId: POKEMON.Tangela, level: 66, statMult: 1.5, passives: [{ type: 'grass', level: 2 }] },
      { speciesId: POKEMON.Vileplume, level: 68, statMult: 1.8, passives: [{ type: 'grass', level: 2 }, { type: 'poison', level: 1 }] },
    ],
  },
  [GymId.Fucsia]: {
    leader: 'Koga',
    type: 'poison',
    badge: Badge.Soul,
    maxLevel: 82,
    team: [
      { speciesId: POKEMON.Koffing, level: 74, statMult: 1.5, passives: [{ type: 'poison', level: 2 }] },
      { speciesId: POKEMON.Muk, level: 74, statMult: 1.5, passives: [{ type: 'poison', level: 2 }] },
      { speciesId: POKEMON.Koffing, level: 75, statMult: 1.6, passives: [{ type: 'poison', level: 2 }] },
      { speciesId: POKEMON.Weezing, level: 76, statMult: 1.8, passives: [{ type: 'poison', level: 3 }] },
    ],
  },
  [GymId.Azafran]: {
    leader: 'Sabrina',
    type: 'psychic',
    badge: Badge.Marsh,
    maxLevel: 88,
    team: [
      { speciesId: POKEMON.Kadabra, level: 79, statMult: 1.6, passives: [{ type: 'psychic', level: 2 }] },
      { speciesId: POKEMON.MrMime, level: 79, statMult: 1.6, passives: [{ type: 'psychic', level: 2 }] },
      { speciesId: POKEMON.Espeon, level: 80, statMult: 1.7, passives: [{ type: 'psychic', level: 2 }] },
      { speciesId: POKEMON.Alakazam, level: 81, statMult: 1.9, passives: [{ type: 'psychic', level: 3 }] },
    ],
  },
  [GymId.Canela]: {
    leader: 'Blaine',
    type: 'fire',
    badge: Badge.Volcano,
    maxLevel: 94,
    team: [
      { speciesId: POKEMON.Ninetales, level: 86, statMult: 1.6, passives: [{ type: 'fire', level: 2 }] },
      { speciesId: POKEMON.Rapidash, level: 86, statMult: 1.6, passives: [{ type: 'fire', level: 2 }] },
      { speciesId: POKEMON.Magmar, level: 87, statMult: 1.7, passives: [{ type: 'fire', level: 2 }] },
      { speciesId: POKEMON.Arcanine, level: 88, statMult: 2, passives: [{ type: 'fire', level: 3 }] },
    ],
  },
  [GymId.Verde]: {
    leader: 'Giovanni',
    type: 'ground',
    badge: Badge.Earth,
    maxLevel: 98,
    team: [
      { speciesId: POKEMON.Rhyhorn, level: 88, statMult: 1.6, passives: [{ type: 'ground', level: 2 }] },
      { speciesId: POKEMON.Dugtrio, level: 88, statMult: 1.6, passives: [{ type: 'ground', level: 2 }] },
      { speciesId: POKEMON.Nidoqueen, level: 89, statMult: 1.7, passives: [{ type: 'ground', level: 2 }, { type: 'poison', level: 1 }] },
      { speciesId: POKEMON.Nidoking, level: 89, statMult: 1.7, passives: [{ type: 'ground', level: 2 }, { type: 'poison', level: 1 }] },
      { speciesId: POKEMON.Rhydon, level: 90, statMult: 2, passives: [{ type: 'ground', level: 3 }] },
    ],
  },
  ...ELITE_FOUR,
}

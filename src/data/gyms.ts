import { Badge } from './badges'
import { IMOVE } from './incursionMoves'
import { POKEMON } from './pokemon'
import type { TrainerTeam } from './trainerTeam'

// Gimnasios: el líder y su equipo, que saca uno tras otro en la parada de gimnasio (`NodeKind.Gym`) de su ruta
// (kantoMaps.ts). Este fichero es para editarlo a mano. Ganar al último da la medalla la primera vez (ver
// game/run/runGym.ts). El dibujo de cada líder, en ui/route/gym/leaderSprites.ts.

export const GymId = { Plateada: 'plateada', Celeste: 'celeste', CiudadCarmin: 'ciudad-carmin' } as const
export type GymId = (typeof GymId)[keyof typeof GymId]

export interface Gym {
  /** Nombre del líder, tal y como se ve */
  leader: string
  badge: Badge
  /** Nivel máximo para entrar: un Pokémon por encima no puede empezar su ruta (subir de nivel dentro no lo echa) */
  maxLevel: number
  team: TrainerTeam
}

export const GYMS: Record<GymId, Gym> = {
  [GymId.Plateada]: {
    leader: 'Brock',
    badge: Badge.Boulder,
    maxLevel: 30,
    team: [
      { speciesId: POKEMON.Geodude, level: 20, passives: [{ type: 'rock', level: 1 }] },
      { speciesId: POKEMON.Onix, level: 23, passives: [{ type: 'rock', level: 2 }] },
    ],
  },
  [GymId.Celeste]: {
    leader: 'Misty',
    badge: Badge.Cascade,
    maxLevel: 50,
    team: [
      { speciesId: POKEMON.Staryu, level: 41, passives: [{ type: 'water', level: 2 }], statMult: 1.2, moves: [IMOVE.PistolaAgua.id, IMOVE.Buceo.id] },
      { speciesId: POKEMON.Starmie, level: 43, passives: [{ type: 'water', level: 2 }], statMult: 1.5, moves: [IMOVE.Confusion.id, IMOVE.Hidropulso.id]  },
    ],
  },
  [GymId.CiudadCarmin]: {
    leader: 'Lt. Surge',
    badge: Badge.Thunder,
    maxLevel: 60,
    team: [
      { speciesId: POKEMON.Pikachu, level: 50, passives: [{ type: 'electric', level: 2 }], statMult: 1.4, moves: [IMOVE.PlacajeElectrico.id, IMOVE.VelocidadExtrema.id, IMOVE.Surf.id] },
      { speciesId: POKEMON.Raichu, level: 55, passives: [{ type: 'electric', level: 2 }, { type: 'ghost', level: 1 }], statMult: 1.8, moves: [IMOVE.Trueno.id, IMOVE.DobleFilo.id] },
    ],
  },
}

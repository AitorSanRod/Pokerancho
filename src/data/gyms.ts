import { Badge } from './badges'
import { IMOVE } from './incursionMoves'
import type { Boss } from './maps/mapCommon'
import { POKEMON } from './pokemon'

// Gimnasios: el líder y su equipo, que saca uno tras otro en la parada de gimnasio (`NodeKind.Gym`) de su ruta
// (kantoMaps.ts). Este fichero es para editarlo a mano. Ganar al último da la medalla la primera vez (ver
// game/run/runGym.ts). El dibujo de cada líder, en ui/route/gym/leaderSprites.ts.

export const GymId = { Plateada: 'plateada', Celeste: 'celeste', CiudadCarmin: 'ciudad-carmin' } as const
export type GymId = (typeof GymId)[keyof typeof GymId]

/** Un Pokémon del líder: especie y nivel, y a mano sus pasivas de tipo, su multiplicador de stats y sus ataques */
export interface GymFoe extends Boss {
  /** Multiplicador de sus stats (1 = las de su nivel, 1.2 = +20 %); sin él, 1 */
  statMult?: number
  /**
   * Ataques de incursión que usa (`IMOVE.X.id`), de daño: en cada turno, el que más daño espera hacer al rival (tipo,
   * potencia y precisión). Sin ellos, el suyo de siempre
   */
  moves?: string[]
}

export interface Gym {
  /** Nombre del líder, tal y como se ve */
  leader: string
  badge: Badge
  /** Nivel máximo para entrar: un Pokémon por encima no puede empezar su ruta (subir de nivel dentro no lo echa) */
  maxLevel: number
  /** Su equipo, en el orden en que los saca */
  team: GymFoe[]
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
    maxLevel: 49,
    team: [
      { speciesId: POKEMON.Staryu, level: 41, passives: [{ type: 'water', level: 2 }, { type: 'psychic', level: 1 }], statMult: 1.2, moves: [IMOVE.PistolaAgua.id, IMOVE.Buceo.id] },
      { speciesId: POKEMON.Starmie, level: 44, passives: [{ type: 'water', level: 2 }, { type: 'ghost', level: 1 }, { type: 'psychic', level: 1 }], statMult: 2, moves: [IMOVE.Psiquico.id, IMOVE.RayoAurora.id]  },
    ],
  },
  [GymId.CiudadCarmin]: {
    leader: 'Lt. Surge',
    badge: Badge.Thunder,
    maxLevel: 50,
    team: [
      { speciesId: POKEMON.Pikachu, level: 50, passives: [{ type: 'electric', level: 2 }], statMult: 2, moves: [IMOVE.PlacajeElectrico.id, IMOVE.VelocidadExtrema.id, IMOVE.Surf.id] },
      { speciesId: POKEMON.Raichu, level: 55, passives: [{ type: 'electric', level: 2 }, { type: 'ghost', level: 1 }], statMult: 3, moves: [IMOVE.Trueno.id, IMOVE.DobleFilo.id] },
    ],
  },
}

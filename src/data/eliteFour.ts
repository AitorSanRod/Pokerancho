import type { Gym } from './gyms'
import { POKEMON } from './pokemon'

// Alto Mando y Campeón: cada uno es un «gimnasio» sin medalla (data/gyms.ts los junta en GYMS) y salen uno tras otro
// en la ruta del Alto Mando (kantoEndMaps.ts), con una cura entre medias. Este fichero es para editarlo a mano.

/** Nivel máximo para entrar en la Liga: cualquiera (el máximo del juego) */
const LEAGUE_MAX_LEVEL = 100

export const ELITE_FOUR = {
  lorelei: {
    leader: 'Lorelei',
    type: 'ice',
    maxLevel: LEAGUE_MAX_LEVEL,
    team: [
      { speciesId: POKEMON.Dewgong, level: 94, statMult: 1.5, passives: [{ type: 'ice', level: 2 }] },
      { speciesId: POKEMON.Cloyster, level: 94, statMult: 1.5, passives: [{ type: 'ice', level: 2 }] },
      { speciesId: POKEMON.Slowbro, level: 95, statMult: 1.6, passives: [{ type: 'water', level: 2 }] },
      { speciesId: POKEMON.Jynx, level: 95, statMult: 1.6, passives: [{ type: 'ice', level: 2 }] },
      { speciesId: POKEMON.Lapras, level: 96, statMult: 1.8, passives: [{ type: 'ice', level: 2 }, { type: 'water', level: 2 }] },
    ],
  },
  bruno: {
    leader: 'Bruno',
    type: 'fighting',
    maxLevel: LEAGUE_MAX_LEVEL,
    team: [
      { speciesId: POKEMON.Onix, level: 95, statMult: 1.5, passives: [{ type: 'rock', level: 2 }] },
      { speciesId: POKEMON.Hitmonchan, level: 95, statMult: 1.6, passives: [{ type: 'fighting', level: 2 }] },
      { speciesId: POKEMON.Hitmonlee, level: 96, statMult: 1.6, passives: [{ type: 'fighting', level: 2 }] },
      { speciesId: POKEMON.Onix, level: 96, statMult: 1.6, passives: [{ type: 'rock', level: 2 }] },
      { speciesId: POKEMON.Machamp, level: 97, statMult: 1.8, passives: [{ type: 'fighting', level: 3 }] },
    ],
  },
  agatha: {
    leader: 'Agatha',
    type: 'ghost',
    maxLevel: LEAGUE_MAX_LEVEL,
    team: [
      { speciesId: POKEMON.Gengar, level: 96, statMult: 1.6, passives: [{ type: 'ghost', level: 2 }] },
      { speciesId: POKEMON.Golbat, level: 96, statMult: 1.5, passives: [{ type: 'poison', level: 2 }] },
      { speciesId: POKEMON.Haunter, level: 97, statMult: 1.6, passives: [{ type: 'ghost', level: 2 }] },
      { speciesId: POKEMON.Arbok, level: 97, statMult: 1.6, passives: [{ type: 'poison', level: 2 }] },
      { speciesId: POKEMON.Gengar, level: 98, statMult: 1.9, passives: [{ type: 'ghost', level: 3 }] },
    ],
  },
  lance: {
    leader: 'Lance',
    type: 'dragon',
    maxLevel: LEAGUE_MAX_LEVEL,
    team: [
      { speciesId: POKEMON.Gyarados, level: 97, statMult: 1.6, passives: [{ type: 'water', level: 2 }] },
      { speciesId: POKEMON.Dragonair, level: 97, statMult: 1.7, passives: [{ type: 'dragon', level: 2 }] },
      { speciesId: POKEMON.Dragonair, level: 98, statMult: 1.7, passives: [{ type: 'dragon', level: 2 }] },
      { speciesId: POKEMON.Aerodactyl, level: 98, statMult: 1.7, passives: [{ type: 'rock', level: 2 }] },
      { speciesId: POKEMON.Dragonite, level: 99, statMult: 1.9, passives: [{ type: 'dragon', level: 3 }] },
    ],
  },
  campeon: {
    leader: 'Campeón Azul',
    type: 'normal',
    maxLevel: LEAGUE_MAX_LEVEL,
    team: [
      { speciesId: POKEMON.Pidgeot, level: 98, statMult: 1.7, passives: [{ type: 'flying', level: 2 }] },
      { speciesId: POKEMON.Alakazam, level: 98, statMult: 1.7, passives: [{ type: 'psychic', level: 2 }] },
      { speciesId: POKEMON.Rhydon, level: 99, statMult: 1.8, passives: [{ type: 'ground', level: 2 }] },
      { speciesId: POKEMON.Arcanine, level: 99, statMult: 1.8, passives: [{ type: 'fire', level: 2 }] },
      { speciesId: POKEMON.Exeggutor, level: 99, statMult: 1.8, passives: [{ type: 'grass', level: 2 }] },
      { speciesId: POKEMON.Blastoise, level: 100, statMult: 2.2, passives: [{ type: 'water', level: 3 }] },
    ],
  },
} satisfies Record<string, Gym>

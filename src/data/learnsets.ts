import { IMOVE, type IncursionMove } from './incursionMoves'
import { POKEMON, POKEMON_FORM } from './pokemon'
import { Rarity } from './species'

// Qué movimientos puede llevar un Pokémon a una incursión (el repertorio lo arma game/incursion/repertoire.ts): por cada
// uno de sus tipos, su mejor ataque de daño y el de apoyo del tipo (data/incursionMoves); además, los propios de su
// especie. Las especies o formas de CUSTOM_MOVESETS llevan solo los suyos. Para editar a mano.

/**
 * Nivel desde el que se pasa al ataque de daño de cada escalón de sus tipos (lleva el más alto al que llega). Nunca uno de
 * un escalón por encima de su rareza: un común se queda en el común; un épico llega hasta el épico
 */
export const DAMAGE_TIER_LEVELS: Record<Rarity, number> = {
  [Rarity.Common]: 1,
  [Rarity.Rare]: 20,
  [Rarity.Epic]: 35,
  [Rarity.Legendary]: 50,
}

/** Un movimiento y el nivel desde el que se aprende */
export interface LearnedMove {
  move: IncursionMove
  level: number
}

/** Movimientos propios de algunas especies, además de los de sus tipos */
export const SPECIES_MOVES: Partial<Record<number, LearnedMove[]>> = {
  [POKEMON.Gyarados]: [{ move: IMOVE.DanzaDragon, level: 30 }],
  [POKEMON.Chansey]: [{ move: IMOVE.PulsoCura, level: 15 }],
  [POKEMON.Lapras]: [{ move: IMOVE.AcuaAro, level: 20 }],
}

/**
 * Repertorio a mano de una especie o una forma (por su id de `POKEMON` o `POKEMON_FORM`): lleva exactamente estos
 * movimientos, cada uno desde su nivel, en lugar de los de sus tipos y los de SPECIES_MOVES
 */
export const CUSTOM_MOVESETS: Partial<Record<number, LearnedMove[]>> = {
  [POKEMON_FORM.RotomWash]: [
    { move: IMOVE.Rayo, level: 1 },
    { move: IMOVE.Hidrobomba, level: 20 },
    { move: IMOVE.AcuaAro, level: 25 },
    { move: IMOVE.Trueno, level: 35 },
  ],
  [POKEMON.Rotom]: [
    { move: IMOVE.Rayo, level: 1 },
    { move: IMOVE.BolaSombra, level: 20 },
    { move: IMOVE.LlantoFalso, level: 30 },
  ],
  [POKEMON.Venusaur]: [
    { move: IMOVE.Toxico, level: 1 },
    { move: IMOVE.Sintesis, level: 1 },
    { move: IMOVE.RayoSolar, level: 1 },
    { move: IMOVE.BombaLodo, level: 1 },
  ],
}

import { IMOVE } from './incursionMoves'
import { POKEMON } from './pokemon'
import { Rarity } from './species'

// Qué movimientos puede llevar un Pokémon a una incursión (el repertorio lo arma game/incursion/repertoire.ts): por cada
// uno de sus tipos, su mejor ataque de daño y el de apoyo del tipo (data/incursionMoves); además, los propios de su
// especie. Para editar a mano.

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

/** Movimientos propios de algunas especies, además de los de sus tipos, con el nivel desde el que los aprenden */
export const SPECIES_MOVES: Partial<Record<number, { moveId: string; level: number }[]>> = {
  [POKEMON.Gyarados]: [{ moveId: IMOVE.DragonDance.id, level: 30 }],
  [POKEMON.Chansey]: [{ moveId: IMOVE.HealPulse.id, level: 15 }],
  [POKEMON.Lapras]: [{ moveId: IMOVE.AquaRing.id, level: 20 }],
}

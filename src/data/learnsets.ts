import { MOVES, type Move } from './moves'
import { POKEMON } from './pokemon'
import { Rarity } from './species'
import { MoveKind, SUPPORT_MOVES, type SupportMove } from './supportMoves'

// Qué movimientos puede llevar un Pokémon a una incursión (el repertorio lo arma game/incursion/repertoire.ts): por cada
// uno de sus tipos, su mejor ataque de daño y el de apoyo del tipo (supportMoves.ts); además, los propios de su especie.
// Para editar a mano.

export type DamageMove = Move & { kind: typeof MoveKind.Damage }
/** Un movimiento de incursión: de daño (los de siempre) o de apoyo */
export type BattleMove = DamageMove | SupportMove

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
  [POKEMON.Gyarados]: [{ moveId: 'dragon-dance', level: 30 }],
  [POKEMON.Chansey]: [{ moveId: 'heal-pulse', level: 15 }],
  [POKEMON.Lapras]: [{ moveId: 'aqua-ring', level: 20 }],
}

const BATTLE_MOVES: Record<string, BattleMove> = Object.fromEntries([
  ...Object.values(MOVES).map((mv): [string, BattleMove] => [mv.id, { ...mv, kind: MoveKind.Damage }]),
  ...Object.values(SUPPORT_MOVES).map((mv): [string, BattleMove] => [mv.id, mv]),
])

export function battleMove(id: string): BattleMove {
  const mv = BATTLE_MOVES[id]
  if (!mv) throw new Error(`Movimiento desconocido: ${id}`)
  return mv
}

export const isBattleMove = (id: string): boolean => id in BATTLE_MOVES

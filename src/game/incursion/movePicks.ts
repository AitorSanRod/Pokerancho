import { battleMove, isBattleMove, type BattleMove } from '../../data/learnsets'
import { MoveKind } from '../../data/supportMoves'
import type { Battlefield } from './battlefield'
import type { GroupFighter } from './fighter'
import type { MovePick } from './tapWindow'

// Cambiar de ataque y de objetivo en plena pelea: el jugador lo elige cuando quiere y vale desde la siguiente ventana de
// toques; desde ahí su Pokémon sigue con ese ataque y ese objetivo hasta que lo vuelva a cambiar.

/** Aplica los cambios de ataque y objetivo de la ventana a los Pokémon del grupo */
export function applyPicks(bf: Battlefield, picks: Record<string, MovePick>) {
  for (const [id, pick] of Object.entries(picks)) {
    const f = bf.party.find((p) => p.id === id)
    if (!f || !isBattleMove(pick.moveId)) continue
    f.move = battleMove(pick.moveId)
    f.target = pick.target
  }
}

/** El objetivo elegido, si sigue entre los que puede tocar ese movimiento; si no (cayó o cambió la sala), ninguno */
export const pickedTarget = (actor: GroupFighter, candidates: GroupFighter[]): GroupFighter | undefined =>
  actor.target ? candidates.find((c) => c.id === actor.target) : undefined

export const PickSide = { Foes: 'foes', Allies: 'allies' } as const
export type PickSide = (typeof PickSide)[keyof typeof PickSide]

/**
 * A quién se puede dirigir un ataque: golpes, bajadas y estados contra un solo rival, a un rival; curas a uno, a un
 * aliado; los de área y los que suben stats a todo el grupo no piden objetivo (null)
 */
export function pickSide(move: BattleMove): PickSide | null {
  if (move.kind === MoveKind.Damage) return PickSide.Foes
  if (move.kind === MoveKind.Heal) return move.area ? null : PickSide.Allies
  if (move.kind === MoveKind.Debuff || move.kind === MoveKind.Inflict) return move.area ? null : PickSide.Foes
  return null
}

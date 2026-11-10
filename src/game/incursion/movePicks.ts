import { incursionMove, isIncursionMove, type IncursionMove } from '../../data/incursionMoves'
import { EffectKind, effectOf, hasArea, MoveClass, moveClass } from '../../data/incursionMoves'
import type { Battlefield } from './battlefield'
import type { GroupFighter } from './fighter'
import type { MovePick } from './tapWindow'

// Cambiar de ataque y de objetivo en plena pelea: el jugador lo elige cuando quiere y vale desde la siguiente ventana de
// toques; desde ahí su Pokémon sigue con ese ataque y ese objetivo hasta que lo vuelva a cambiar.

/** Aplica los cambios de ataque y objetivo de la ventana a los Pokémon del grupo */
export function applyPicks(bf: Battlefield, picks: Record<string, MovePick>) {
  for (const [id, pick] of Object.entries(picks)) {
    const f = bf.party.find((p) => p.id === id)
    if (!f || !isIncursionMove(pick.moveId)) continue
    f.move = incursionMove(pick.moveId)
    f.moves = [f.move]
    f.target = pick.target
  }
}

/** El objetivo elegido, si sigue entre los que puede tocar ese movimiento; si no (cayó o cambió la sala), ninguno */
export const pickedTarget = (actor: GroupFighter, candidates: GroupFighter[]): GroupFighter | undefined =>
  actor.target ? candidates.find((c) => c.id === actor.target) : undefined

export const PickSide = { Foes: 'foes', Allies: 'allies' } as const
export type PickSide = (typeof PickSide)[keyof typeof PickSide]

/**
 * A quién se puede dirigir un ataque: los de daño y los de estado que bajan stats o ponen estados a uno, a un rival; los
 * de cura a uno, a un aliado; los de área, los que curan al grupo y los que suben stats al grupo no piden objetivo (null)
 */
export function pickSide(move: IncursionMove): PickSide | null {
  const cls = moveClass(move)
  if (cls === MoveClass.Damage) return hasArea(move) ? null : PickSide.Foes
  if (cls === MoveClass.Heal) return effectOf(move, EffectKind.HealAlly) ? PickSide.Allies : null
  const hostile = effectOf(move, EffectKind.Inflict) || effectOf(move, EffectKind.Lower)
  return hostile && !hasArea(move) ? PickSide.Foes : null
}

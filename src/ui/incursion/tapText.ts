import { MoveClass, moveClass, type IncursionMove } from '../../data/incursionMoves'
import { TAP_CRIT_MULT } from '../../game/battle/attack'
import { STATUS_PERFECT_MULT } from '../../game/incursion/tapWindow'

// Cómo se cuenta en la ventana de toques lo que mejora el ataque.

/** Qué mejora cada clase de ataque con los toques */
export const TAP_GAIN: Record<MoveClass, string> = {
  [MoveClass.Damage]: 'de daño',
  [MoveClass.Heal]: 'de cura',
  [MoveClass.Status]: 'de daño y cura al grupo',
}

/** Lo que da acertar todos los anillos */
export function perfectText(mv: IncursionMove): string {
  switch (moveClass(mv)) {
    case MoveClass.Damage:
      return `¡Crítico! (×${TAP_CRIT_MULT})`
    case MoveClass.Heal:
      return `¡Cura crítica! (×${TAP_CRIT_MULT})`
    case MoveClass.Status:
      return `¡Mejora ×${STATUS_PERFECT_MULT} al grupo!`
  }
}

export const gainText = (mv: IncursionMove, gain: number) => `+${Math.round(gain * 100)}% ${TAP_GAIN[moveClass(mv)]}`

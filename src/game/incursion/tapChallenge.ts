import { hasArea, MoveClass, moveClass, TapKind, type IncursionMove, type TapChallenge } from '../../data/incursionMoves'

// El reto de la ventana de toques de cada ataque, por regla (salvo que el ataque lleve el suyo a mano, `tap`):
// - los de daño con prioridad, un anillo (rápido y certero);
// - los de daño fuertes o de área, una secuencia de anillos;
// - el resto de los de daño, machacar: más potencia pide más toques y da más mejora;
// - los de cura y los de estado, anillos: acertarlos todos es cura crítica o una mejora mayor para el grupo.
// Lo conseguido es una puntuación de 0 a 1 (`tapScore`) que va en las órdenes del turno (ver tapWindow.ts).

/** Toques que pide cada punto de potencia en los de machacar (potencia 80 → 32 toques) */
export const MASH_TAPS_PER_POWER = 0.4
/** Toques que pide como poco un ataque de machacar */
export const MASH_MIN_TAPS = 15
/** Toques que pide como mucho un ataque de machacar */
export const MASH_MAX_TAPS = 50
/** Mejora por cada toque que pide un ataque de machacar: piden más, mejoran más (0.004: 32 toques → +12,8%) */
export const MASH_BONUS_PER_TAP = 0.004
/** Partes en que se cuenta lo machacado: la mejora sube a saltos (5: de 20% en 20% de la meta) */
export const TAP_SCORE_STEPS = 5
/** Potencia desde la que un ataque de daño pide una secuencia de anillos en lugar de machacar */
export const SEQUENCE_MIN_POWER = 90
/** Anillos de un ataque de daño fuerte o de área */
export const SEQUENCE_RINGS = { min: 2, max: 3 }
/** Anillos de un ataque de daño con prioridad */
export const PRIORITY_RINGS = { min: 1, max: 1 }
/** Anillos de un ataque de cura */
export const HEAL_RINGS = { min: 1, max: 2 }
/** Anillos de un ataque de estado */
export const STATUS_RINGS = { min: 1, max: 3 }
/** Mejora de un ataque de anillos por la parte acertada sin acertarlos todos (0.2: 2 de 3 → +13%) */
export const RING_TAP_BONUS = 0.2

const rings = (range: { min: number; max: number }): TapChallenge => ({ kind: TapKind.Rings, ...range, bonus: RING_TAP_BONUS })

function mash(power: number): TapChallenge {
  const goal = Math.min(MASH_MAX_TAPS, Math.max(MASH_MIN_TAPS, Math.round(power * MASH_TAPS_PER_POWER)))
  return { kind: TapKind.Mash, goal, bonus: goal * MASH_BONUS_PER_TAP }
}

/** El reto del ataque: el suyo a mano o el de la regla */
export function tapChallengeOf(mv: IncursionMove): TapChallenge {
  if (mv.tap) return mv.tap
  const cls = moveClass(mv)
  if (cls === MoveClass.Heal) return rings(HEAL_RINGS)
  if (cls === MoveClass.Status) return rings(STATUS_RINGS)
  if (mv.priority > 0) return rings(PRIORITY_RINGS)
  if (mv.power >= SEQUENCE_MIN_POWER || hasArea(mv)) return rings(SEQUENCE_RINGS)
  return mash(mv.power)
}

/** Lo machacado como puntuación: la parte de la meta conseguida, a saltos de 1/TAP_SCORE_STEPS */
export const mashScore = (taps: number, goal: number): number => Math.floor(Math.min(1, taps / goal) * TAP_SCORE_STEPS) / TAP_SCORE_STEPS

/** Los anillos como puntuación: la parte acertada */
export const ringScore = (hits: number, total: number): number => (total > 0 ? hits / total : 0)

/** Si esa puntuación es el reto entero de anillos: crítico (daño), cura crítica o mejora mayor al grupo (estado) */
export const isPerfect = (ch: TapChallenge, score: number): boolean => ch.kind === TapKind.Rings && score >= 1

/** Lo que mejora el ataque con esa puntuación, sin el crítico (acertar todos los anillos no suma aquí) */
export const partialGain = (ch: TapChallenge, score: number): number => (isPerfect(ch, score) ? 0 : ch.bonus * Math.min(1, Math.max(0, score)))

/** Si es una puntuación del reto válida (lo que acepta el servidor) */
export const isTapScore = (v: unknown): v is number => typeof v === 'number' && v >= 0 && v <= 1

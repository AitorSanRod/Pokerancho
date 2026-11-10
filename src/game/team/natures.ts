import { Nature, NATURES, NEUTRAL_NATURE, type NatureStat } from '../../data/natures'
import type { Rng } from '../core/random'

/** Lo que sube (o baja) la stat favorecida (o perjudicada) por la naturaleza: 0.1 = ±10% */
export const NATURE_MOD = 0.1

const ALL_NATURES = Object.values(Nature)

export const isNature = (v: unknown): v is Nature => ALL_NATURES.includes(v as Nature)

/** Una naturaleza al azar, todas con la misma probabilidad (también la neutra) */
export const randomNature = (rng: Rng = Math.random): Nature => ALL_NATURES[Math.floor(rng() * ALL_NATURES.length)]

/** Multiplicador de una stat por la naturaleza: 1 + NATURE_MOD si la sube, 1 − NATURE_MOD si la baja, 1 si no la toca */
export function natureMult(nature: Nature = NEUTRAL_NATURE, stat: NatureStat): number {
  const { up, down } = NATURES[nature] ?? NATURES[NEUTRAL_NATURE]
  if (stat === up) return 1 + NATURE_MOD
  if (stat === down) return 1 - NATURE_MOD
  return 1
}

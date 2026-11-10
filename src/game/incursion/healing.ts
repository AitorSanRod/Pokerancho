import { SPECIES } from '../../data/species'
import { stat, type GroupFighter } from './fighter'

// Cuánto cura un ataque de cura: su potencia se convierte en PS con la fórmula del daño (nivel, potencia y Ataque del
// curador), sin Defensa del rival: se divide entre la Defensa de una especie media de su nivel. Sin STAB, tipos,
// crítico ni azar.

/** Defensa base media de todas las especies: la de referencia para convertir potencia en cura */
const REFERENCE_BASE_DEF = SPECIES.reduce((sum, sp) => sum + sp.base.def, 0) / SPECIES.length

/** Defensa de una especie media a ese nivel (la misma fórmula de las stats, sin ★) */
export const referenceDefense = (level: number): number => Math.floor((2 * REFERENCE_BASE_DEF * level) / 100 + 5)

/** PS que cura un ataque de esa potencia, antes de su fracción y de la mejora de los toques */
export function healAmount(healer: GroupFighter, power: number): number {
  const attack = stat(healer, 'atk')
  return (((2 * healer.level) / 5 + 2) * power * (attack / referenceDefense(healer.level))) / 50 + 2
}

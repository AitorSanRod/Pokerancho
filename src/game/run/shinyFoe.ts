import type { Rng } from '../core/random'

/** Probabilidad (0–1) de que el rival de una parada de ruta (salvaje o jefe) salga shiny */
export const SHINY_FOE_CHANCE = 0.075
/** Lo que suma un rival shiny a su multiplicador de stats (0,5 = +50 % de sus stats; se suma al de la parada) */
export const SHINY_FOE_STAT_BONUS = 0.5
/** Multiplicador de la EXP por derrotar a un rival shiny */
export const SHINY_FOE_EXP_MULT = 5

/** Si el rival que aparece sale shiny */
export const rollShinyFoe = (rng: Rng): boolean => rng() < SHINY_FOE_CHANCE

/** Multiplicador de stats del rival: el de la parada, más el bono si es shiny */
export const foeStatMult = (statMult: number, shiny: boolean): number => (shiny ? statMult + SHINY_FOE_STAT_BONUS : statMult)

/** Multiplicador de la EXP por derrotarlo */
export const foeExpMult = (shiny: boolean): number => (shiny ? SHINY_FOE_EXP_MULT : 1)

/** Texto del principio del combate contra un rival shiny */
export const shinyIntro = (name: string, level: number): string => `¡Un ${name} shiny de Nv. ${level} apareció!`

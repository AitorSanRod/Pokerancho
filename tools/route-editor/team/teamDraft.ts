// Un Pokémon del equipo de un líder de gimnasio o de un entrenador, en el editor: claves de los diccionarios (POKEMON,
// IMOVE) en lugar de sus valores, para que el formulario las muestre y el código las escriba tal cual.

import type { TrainerFoe } from '../../../src/data/trainerTeam'
import { DICTS, keyOf } from '../catalog'
import type { PassiveDraft } from '../draft'
import { MOVE_IDS } from '../incursion/incCatalog'

export interface FoeDraft {
  /** Clave de POKEMON */
  species: string
  level: number
  /** Multiplicador de stats; null = 1 (no se escribe) */
  statMult: number | null
  passives: PassiveDraft[]
  /** Claves de IMOVE; ninguna = el ataque de siempre de la especie */
  moves: string[]
}

export const emptyFoe = (level = 20): FoeDraft => ({ species: '', level, statMult: null, passives: [], moves: [] })

/** Clave de IMOVE a partir del id guardado en los datos (el que no existe se queda como está, para los avisos) */
const moveKey = (id: string): string => Object.keys(MOVE_IDS).find((k) => MOVE_IDS[k] === id) ?? (keyOf({}, id) || id)

/** Borrador de un Pokémon del equipo del juego (o pegado) */
export const foeDraft = (f: TrainerFoe): FoeDraft => ({
  species: keyOf(DICTS.POKEMON, f.speciesId),
  level: f.level,
  statMult: f.statMult ?? null,
  passives: [...(f.passives ?? [])],
  moves: (f.moves ?? []).map(moveKey),
})

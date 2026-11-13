// Borrador de un gimnasio en el editor: claves de los diccionarios (POKEMON, Badge, IMOVE) en lugar de sus valores,
// para que el formulario las muestre y el código las escriba tal cual.

import { BADGES, type Badge } from '../../../src/data/badges'
import type { Gym, GymFoe } from '../../../src/data/gyms'
import { keyOf, DICTS } from '../catalog'
import type { PassiveDraft } from '../draft'
import { MOVE_IDS } from '../incursion/incCatalog'
import { loadStored, store } from '../mode'

export interface GymFoeDraft {
  /** Clave de POKEMON */
  species: string
  level: number
  /** Multiplicador de stats; null = 1 (no se escribe) */
  statMult: number | null
  passives: PassiveDraft[]
  /** Claves de IMOVE; ninguna = el ataque de siempre de la especie */
  moves: string[]
}

export interface GymDraft {
  /** Clave de GymId: `Celeste` */
  idKey: string
  /** Valor de GymId (solo cuenta si es nuevo): `celeste` */
  idValue: string
  leader: string
  /** Clave de Badge: `Cascade` */
  badge: string
  /** Nivel máximo para entrar */
  maxLevel: number
  team: GymFoeDraft[]
}

/** Badge por su clave (`Boulder` → 'boulder') */
export const BADGES_BY_KEY: Record<string, Badge> = Object.fromEntries(
  Object.entries(DICTS.Badge).map(([k, v]) => [k, v as Badge]),
) as Record<string, Badge>

export const badgeName = (key: string): string => (key in BADGES_BY_KEY ? BADGES[BADGES_BY_KEY[key]].name : '')

export const emptyGymFoe = (): GymFoeDraft => ({ species: '', level: 20, statMult: null, passives: [], moves: [] })

export const emptyGym = (): GymDraft => ({ idKey: '', idValue: '', leader: '', badge: Object.keys(BADGES_BY_KEY)[0], maxLevel: 30, team: [emptyGymFoe()] })

/** Clave de IMOVE a partir del id guardado en los datos */
const moveKey = (id: string): string => Object.keys(MOVE_IDS).find((k) => MOVE_IDS[k] === id) ?? (keyOf({}, id) || id)

const foeDraft = (f: GymFoe): GymFoeDraft => ({
  species: keyOf(DICTS.POKEMON, f.speciesId),
  level: f.level,
  statMult: f.statMult ?? null,
  passives: [...(f.passives ?? [])],
  moves: (f.moves ?? []).map(moveKey),
})

/** Borrador de un gimnasio del juego (o pegado) */
export const fromGym = (idKey: string, idValue: string, g: Gym): GymDraft => ({
  idKey,
  idValue,
  leader: g.leader,
  badge: keyOf(DICTS.Badge, g.badge),
  maxLevel: g.maxLevel,
  team: g.team.map(foeDraft),
})

const STORAGE_KEY = 'gym-editor-draft'

export const loadGymDraft = (): GymDraft => loadStored(STORAGE_KEY, emptyGym)
export const saveGymDraft = (d: GymDraft) => store(STORAGE_KEY, d)

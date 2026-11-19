// Borrador de un gimnasio en el editor: claves de los diccionarios (Badge) en lugar de sus valores, para que el
// formulario las muestre y el código las escriba tal cual. Su equipo, en team/teamDraft.ts.

import { BADGES, type Badge } from '../../../src/data/badges'
import type { Gym } from '../../../src/data/gyms'
import type { PokeType } from '../../../src/data/types'
import { keyOf, DICTS } from '../catalog'
import { loadStored, store } from '../mode'
import { emptyFoe, foeDraft, type FoeDraft } from '../team/teamDraft'

export interface GymDraft {
  /** Clave de GymId: `Celeste` */
  idKey: string
  /** Valor de GymId (solo cuenta si es nuevo): `celeste` */
  idValue: string
  leader: string
  /** Clave de Badge: `Cascade` */
  badge: string
  /** Tipo del líder (da el fondo de su combate): `water` */
  type: PokeType
  /** Nivel máximo para entrar */
  maxLevel: number
  team: FoeDraft[]
}

/** Badge por su clave (`Boulder` → 'boulder') */
export const BADGES_BY_KEY: Record<string, Badge> = Object.fromEntries(
  Object.entries(DICTS.Badge).map(([k, v]) => [k, v as Badge]),
) as Record<string, Badge>

export const badgeName = (key: string): string => (key in BADGES_BY_KEY ? BADGES[BADGES_BY_KEY[key]].name : '')

export const emptyGym = (): GymDraft => ({ idKey: '', idValue: '', leader: '', badge: Object.keys(BADGES_BY_KEY)[0], type: 'normal', maxLevel: 30, team: [emptyFoe()] })

/** Borrador de un gimnasio del juego (o pegado) */
export const fromGym = (idKey: string, idValue: string, g: Gym): GymDraft => ({
  idKey,
  idValue,
  leader: g.leader,
  badge: keyOf(DICTS.Badge, g.badge),
  type: g.type,
  maxLevel: g.maxLevel,
  team: g.team.map(foeDraft),
})

const STORAGE_KEY = 'gym-editor-draft'

export const loadGymDraft = (): GymDraft => loadStored(STORAGE_KEY, emptyGym)
export const saveGymDraft = (d: GymDraft) => store(STORAGE_KEY, d)

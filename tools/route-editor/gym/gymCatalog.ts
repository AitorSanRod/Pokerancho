// Listas del editor de gimnasios, sacadas de los datos del juego.

import { BADGE_IDS, BADGES } from '../../../src/data/badges'
import { GYMS, GymId } from '../../../src/data/gyms'
import { IMOVE, moveClass, MoveClass } from '../../../src/data/incursionMoves'
import { LEADER_SPRITES } from '../../../src/ui/route/gym/leaderSprites'
import { DICTS, keyOf } from '../catalog'

export { GYMS }

/** Gimnasios del juego: [clave de GymId, valor] */
export const GYM_ENTRIES: [string, string][] = Object.entries(GymId)

export const isNewGym = (key: string) => !(key in GymId)

/** GIF del líder ya registrado para ese valor de GymId */
export const leaderSprite = (value: string): string | undefined => LEADER_SPRITES[value as GymId]

/** Las medallas para el desplegable: [clave de Badge, «Medalla Roca · Ciudad Plateada»] */
export const BADGE_OPTIONS: [string, string][] = BADGE_IDS.map((b) => [keyOf(DICTS.Badge, b), `${BADGES[b].name} · ${BADGES[b].city}`])

/** ¿Es un ataque de incursión de daño? (los demás no valen en un combate de ruta) */
export const isDamageMove = (key: string) => key in IMOVE && moveClass(IMOVE[key as keyof typeof IMOVE]) === MoveClass.Damage

/** Gimnasio (clave de GymId) que ya da esa medalla, si es otro */
export function badgeOwner(badgeKey: string, gymKey: string): string | undefined {
  const badge = DICTS.Badge[badgeKey as keyof typeof DICTS.Badge]
  return GYM_ENTRIES.find(([k, v]) => k !== gymKey && GYMS[v as GymId].badge === badge)?.[0]
}

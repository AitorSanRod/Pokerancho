// Medallas de gimnasio de Kanto, en orden. Las da la primera victoria contra el líder de cada gimnasio (data/gyms.ts);
// las que aún no tienen gimnasio se ven apagadas en el perfil. Su dibujo, en ui/profile/BadgeIcon.tsx.

/** Medallas por su id. El valor se guarda en la partida: no cambiarlo sin subir SAVE_VERSION */
export const Badge = {
  Boulder: 'boulder',
  Cascade: 'cascade',
  Thunder: 'thunder',
  Rainbow: 'rainbow',
  Soul: 'soul',
  Marsh: 'marsh',
  Volcano: 'volcano',
  Earth: 'earth',
} as const
export type Badge = (typeof Badge)[keyof typeof Badge]

interface BadgeInfo {
  name: string
  /** Ciudad de su gimnasio */
  city: string
}

export const BADGES: Record<Badge, BadgeInfo> = {
  [Badge.Boulder]: { name: 'Medalla Roca', city: 'Ciudad Plateada' },
  [Badge.Cascade]: { name: 'Medalla Cascada', city: 'Ciudad Celeste' },
  [Badge.Thunder]: { name: 'Medalla Trueno', city: 'Ciudad Carmín' },
  [Badge.Rainbow]: { name: 'Medalla Arcoíris', city: 'Ciudad Azulona' },
  [Badge.Soul]: { name: 'Medalla Alma', city: 'Ciudad Fucsia' },
  [Badge.Marsh]: { name: 'Medalla Pantano', city: 'Ciudad Azafrán' },
  [Badge.Volcano]: { name: 'Medalla Volcán', city: 'Isla Canela' },
  [Badge.Earth]: { name: 'Medalla Tierra', city: 'Ciudad Verde' },
}

/** Las medallas en el orden de la región */
export const BADGE_IDS: Badge[] = Object.values(Badge)

export const isBadge = (v: unknown): v is Badge => (BADGE_IDS as unknown[]).includes(v)

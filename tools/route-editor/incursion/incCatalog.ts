// Listas del editor de incursiones, sacadas de los datos del juego.

import { INCURSIONS, IncursionId, IncursionPrizeKind, IncursionTier, KEY_PRICE, MAX_ROOM_FOES, RoomKind } from '../../../src/data/incursions'
import { IMOVE } from '../../../src/data/incursionMoves'
import { STAR_ITEMS, StarItem } from '../../../src/data/starItems'
import { Tm, tmName } from '../../../src/data/tms'
import { typeName } from '../catalog'

export { INCURSIONS, MAX_ROOM_FOES }

export const INC_DICTS = { IncursionId, IncursionTier, IncursionPrizeKind, RoomKind, StarItem, Tm } as const

/** Clave de IMOVE → id del ataque, para pasar de los datos al borrador */
export const MOVE_IDS: Record<string, string> = Object.fromEntries(Object.entries(IMOVE).map(([k, mv]) => [k, mv.id]))

export const MOVE_KEYS = Object.keys(IMOVE)
export const isMoveKey = (key: string) => key in IMOVE

/** «Rayo · Eléctrico · 90»; vacío si la clave no es un ataque */
export function moveText(key: string): string {
  const mv = IMOVE[key as keyof typeof IMOVE]
  return mv ? `${mv.name} · ${typeName(mv.type)} · ${mv.power}` : ''
}

export const ROOM_LABELS: Record<keyof typeof RoomKind, string> = {
  Battle: 'Combate',
  Heal: 'Curación',
  Revive: 'Revivir',
  Regroup: 'Reagrupar (cambiar movimiento)',
}

export const PRIZE_LABELS: Record<keyof typeof IncursionPrizeKind, string> = {
  Money: 'Dinero (₽)',
  Exp: 'EXP',
  Tickets: 'Tickets',
  Pieces: 'Tickets de una especie',
  StarItem: 'Objeto estelar',
  Tm: 'MT',
}

export const TIER_OPTIONS: [string, string][] = Object.entries(IncursionTier).map(([k, v]) => [k, `${k} (llave: ${KEY_PRICE[v]} ₽)`])

export const STAR_OPTIONS: [string, string][] = Object.entries(StarItem).map(([k, v]) => [k, STAR_ITEMS[v].name])

export const TM_OPTIONS: [string, string][] = Object.entries(Tm).map(([k, v]) => [k, tmName(v)])

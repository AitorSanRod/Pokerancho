import { INCURSIONS, MAX_KEYS, type IncursionId } from '../../data/incursions'
import type { GameState } from '../core/state'
import { keysOf } from '../incursion/keys'

// Regalos del servidor para todos los jugadores (p. ej. para compensar algo que falló): los pone el servidor
// (worker/serverGifts.ts) y cada jugador los recoge una vez en Notificaciones. La partida apunta los ya recogidos.

export interface ServerGift {
  id: string
  /** Por qué se regala, tal y como se ve en Notificaciones */
  title: string
  /** Llaves de incursión que da, por incursión */
  incursionKeys: Partial<Record<IncursionId, number>>
}

export const SERVER_GIFT_ID = /^[a-z0-9-]{1,40}$/
/** Lo más que da de una llave un regalo */
const MAX_GIFT_KEYS = MAX_KEYS
const TITLE_MAX = 120

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

function parseGift(v: unknown): ServerGift | null {
  if (!isObject(v) || typeof v.id !== 'string' || !SERVER_GIFT_ID.test(v.id) || typeof v.title !== 'string' || !isObject(v.incursionKeys)) return null
  const incursionKeys: ServerGift['incursionKeys'] = {}
  for (const inc of INCURSIONS) {
    const n = v.incursionKeys[inc.id]
    if (Number.isInteger(n) && (n as number) > 0) incursionKeys[inc.id] = Math.min(MAX_GIFT_KEYS, n as number)
  }
  return { id: v.id, title: v.title.slice(0, TITLE_MAX), incursionKeys }
}

/** Los regalos que manda el servidor que tienen buena forma; lo que no, se descarta */
export const parseServerGifts = (v: unknown): ServerGift[] => (Array.isArray(v) ? v.map(parseGift).filter((g): g is ServerGift => g !== null) : [])

export const pendingServerGifts = (s: GameState, gifts: ServerGift[]): ServerGift[] => gifts.filter((g) => !s.claimedServerGifts.includes(g.id))

/** Recoge el regalo (una sola vez): suma sus llaves sin pasar del máximo de cada una. false si ya estaba recogido */
export function claimServerGift(s: GameState, gift: ServerGift): boolean {
  if (s.claimedServerGifts.includes(gift.id)) return false
  for (const [id, n] of Object.entries(gift.incursionKeys) as [IncursionId, number][]) {
    s.incursionKeys[id] = Math.min(MAX_KEYS, keysOf(s, id) + n)
  }
  s.claimedServerGifts.push(gift.id)
  return true
}

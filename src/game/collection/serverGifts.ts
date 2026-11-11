import { INCURSIONS, MAX_KEYS, type IncursionId } from '../../data/incursions'
import { isKnownSpecies } from '../../data/species'
import type { GameState } from '../core/state'
import { keysOf } from '../incursion/keys'
import { isNature } from '../team/natures'
import { MAX_LEVEL, MAX_STARS } from '../team/stats'
import { GoodKind, type TradedMon } from '../trade/tradeGoods'
import { receiveBlocker, receiveGood } from '../trade/tradeReceive'

// Regalos del servidor (p. ej. para compensar algo que falló): los pone el servidor (worker/serverGifts.ts), para todos
// o para un jugador, y cada uno se recoge una vez en Notificaciones. La partida apunta los ya recogidos.

export interface ServerGift {
  id: string
  /** Por qué se regala, tal y como se ve en Notificaciones */
  title: string
  /** Llaves de incursión que da, por incursión */
  incursionKeys: Partial<Record<IncursionId, number>>
  /** Pokémon que da (p. ej. los perdidos que se devuelven); si ya se tiene la especie, como en un intercambio repetido */
  mons: TradedMon[]
}

export const SERVER_GIFT_ID = /^[a-z0-9-]{1,40}$/
/** Lo más que da de una llave un regalo */
const MAX_GIFT_KEYS = MAX_KEYS
/** Pokémon como mucho en un regalo */
const MAX_GIFT_MONS = 6
const TITLE_MAX = 160

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const isInt = (v: unknown, min: number, max: number): v is number => Number.isInteger(v) && (v as number) >= min && (v as number) <= max

function parseMon(v: unknown): TradedMon | null {
  if (!isObject(v) || !isKnownSpecies(v.speciesId) || !isInt(v.level, 1, MAX_LEVEL)) return null
  return {
    speciesId: v.speciesId,
    level: v.level,
    exp: 0,
    stars: isInt(v.stars, 0, MAX_STARS) ? v.stars : 0,
    ...(isNature(v.nature) ? { nature: v.nature } : {}),
  }
}

function parseKeys(v: unknown): ServerGift['incursionKeys'] {
  const keys: ServerGift['incursionKeys'] = {}
  if (!isObject(v)) return keys
  for (const inc of INCURSIONS) {
    const n = v[inc.id]
    if (isInt(n, 1, Number.MAX_SAFE_INTEGER)) keys[inc.id] = Math.min(MAX_GIFT_KEYS, n)
  }
  return keys
}

function parseGift(v: unknown): ServerGift | null {
  if (!isObject(v) || typeof v.id !== 'string' || !SERVER_GIFT_ID.test(v.id) || typeof v.title !== 'string') return null
  const mons = Array.isArray(v.mons) ? v.mons.map(parseMon).filter((m): m is TradedMon => m !== null).slice(0, MAX_GIFT_MONS) : []
  return { id: v.id, title: v.title.slice(0, TITLE_MAX), incursionKeys: parseKeys(v.incursionKeys), mons }
}

/** Los regalos que manda el servidor que tienen buena forma; lo que no, se descarta */
export const parseServerGifts = (v: unknown): ServerGift[] => (Array.isArray(v) ? v.map(parseGift).filter((g): g is ServerGift => g !== null) : [])

export const pendingServerGifts = (s: GameState, gifts: ServerGift[]): ServerGift[] => gifts.filter((g) => !s.claimedServerGifts.includes(g.id))

/** Por qué no se puede recoger aún (sus Pokémon no caben en los ranchos ni en la Caja); null si se puede */
export function serverGiftBlocker(s: GameState, gift: ServerGift): string | null {
  const probe = structuredClone(s)
  for (const mon of gift.mons) {
    const blocker = receiveBlocker(probe, { kind: GoodKind.Mon, mon })
    if (blocker) return blocker
    receiveGood(probe, { kind: GoodKind.Mon, mon })
  }
  return null
}

/** Recoge el regalo (una sola vez): suma sus llaves sin pasar del máximo y mete sus Pokémon. false si ya estaba recogido o no cabe */
export function claimServerGift(s: GameState, gift: ServerGift): boolean {
  if (s.claimedServerGifts.includes(gift.id) || serverGiftBlocker(s, gift)) return false
  for (const [id, n] of Object.entries(gift.incursionKeys) as [IncursionId, number][]) {
    s.incursionKeys[id] = Math.min(MAX_KEYS, keysOf(s, id) + n)
  }
  for (const mon of gift.mons) receiveGood(s, { kind: GoodKind.Mon, mon })
  s.claimedServerGifts.push(gift.id)
  return true
}

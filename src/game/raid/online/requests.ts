import { isKnownSpecies } from '../../../data/species'
import type { MemberState } from '../../incursion/fighter'
import { freshMember } from '../../incursion/party'
import { mayKnow } from '../../incursion/tms'
import { isNature } from '../../team/natures'
import { parsePerks } from '../../team/perks'
import { MAX_LEVEL, MAX_STARS } from '../../team/stats'
import { DEFAULT_NICKNAME, NICKNAME_MAX, RAID_ROTATIONS, RaidAction, type RaidRequest, type RaidRotation } from './protocol'

// Lo que llega al servidor viene de cualquiera: se comprueba todo y se descarta lo que no encaje.

const PLAYER_ID = /^[A-Za-z0-9-]{8,64}$/
const MON_UID = /^[A-Za-z0-9_-]{1,32}$/
const ROOM_ID = /^tab\/[a-z]{1,16}\/\d{1,12}\/[A-Za-z0-9]{1,32}$/
const MOVE_ID = /^[a-z0-9-]{1,40}$/
const TARGET_ID = /^[A-Za-z0-9_-]{1,40}$/
/** Ventanas de toques que se aceptan como mucho (de sobra para media hora de pelea) */
const MAX_TURNS = 5000

type Json = Record<string, unknown>

const isObject = (v: unknown): v is Json => typeof v === 'object' && v !== null && !Array.isArray(v)
const isInt = (v: unknown, min: number, max: number): v is number => Number.isInteger(v) && (v as number) >= min && (v as number) <= max
const matches = (v: unknown, re: RegExp): v is string => typeof v === 'string' && re.test(v)
const isRotation = (v: unknown): v is RaidRotation => RAID_ROTATIONS.includes(v as RaidRotation)

/** Apodo sin espacios de más ni caracteres de control, recortado; vacío, el de por defecto */
export function cleanNickname(v: unknown): string {
  const text = typeof v === 'string' ? v.replace(/[\p{C}]/gu, '').replace(/\s+/g, ' ').trim() : ''
  return [...text].slice(0, NICKNAME_MAX).join('') || DEFAULT_NICKNAME
}

/** El Pokémon con el que se entra: que exista, conozca el ataque y no esté debilitado (el nivel del jefe lo mira la sala) */
function parseMember(v: unknown): MemberState | null {
  if (!isObject(v) || !matches(v.id, MON_UID) || !isKnownSpecies(v.speciesId) || !matches(v.moveId, MOVE_ID)) return null
  if (!isInt(v.level, 1, MAX_LEVEL) || !isInt(v.stars, 0, MAX_STARS)) return null
  if (typeof v.hpFraction !== 'number' || !(v.hpFraction > 0 && v.hpFraction <= 1)) return null
  const speciesId = v.speciesId as number
  if (!mayKnow(speciesId, v.level, v.moveId)) return null
  const perks = parsePerks(v.perks)
  if (!perks) return null
  const nature = isNature(v.nature) ? v.nature : undefined
  const fresh = freshMember({ id: v.id, speciesId, level: v.level, stars: v.stars, nature, shiny: v.shiny === true || undefined, perks, moveId: v.moveId })
  return { ...fresh, hpFraction: v.hpFraction }
}

/** Lo que va a una sala ya elegida; null si no encaja */
function parseRoomRequest(body: Json, who: { playerId: string; nickname: string }): RaidRequest | null {
  if (!matches(body.roomId, ROOM_ID)) return null
  const base = { ...who, roomId: body.roomId }
  switch (body.action) {
    case RaidAction.Leave:
    case RaidAction.Sync:
    case RaidAction.Crit:
      return { ...base, action: body.action }
    case RaidAction.Tap:
      return isInt(body.turn, 0, MAX_TURNS) ? { ...base, action: RaidAction.Tap, turn: body.turn } : null
    case RaidAction.Pick: {
      const target = body.target === null ? null : matches(body.target, TARGET_ID) ? body.target : undefined
      return matches(body.moveId, MOVE_ID) && target !== undefined ? { ...base, action: RaidAction.Pick, moveId: body.moveId, target } : null
    }
    default:
      return null
  }
}

/** La petición si es válida; null si falta o sobra algo */
export function parseRequest(body: unknown): RaidRequest | null {
  if (!isObject(body) || !matches(body.playerId, PLAYER_ID)) return null
  const who = { playerId: body.playerId, nickname: cleanNickname(body.nickname) }
  if (body.action === RaidAction.Board) return { action: RaidAction.Board, ...who }
  if (body.action !== RaidAction.Join) return parseRoomRequest(body, who)
  const member = parseMember(body.member)
  return member && isRotation(body.rotation) ? { action: RaidAction.Join, ...who, rotation: body.rotation, member } : null
}

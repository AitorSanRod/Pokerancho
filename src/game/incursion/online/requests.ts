import { INCURSIONS, type IncursionId } from '../../../data/incursions'
import { SPECIES } from '../../../data/species'
import { MAX_STARS } from '../../team/stats'
import { cleanNickname } from '../../raid/online/requests'
import { canEnter } from '../entry'
import type { MemberState } from '../fighter'
import { freshMember } from '../party'
import { canLearn } from '../repertoire'
import { IncursionAction, type IncursionRequest } from './protocol'

// Lo que llega al servidor de incursiones viene de cualquiera: se comprueba todo y se descarta lo que no encaje.

const PLAYER_ID = /^[A-Za-z0-9-]{8,64}$/
const MON_UID = /^[A-Za-z0-9_-]{1,32}$/
export const GROUP_ID = /^[a-f0-9]{8,32}$/
const MOVE_ID = /^[a-z0-9-]{1,40}$/
/** Tramos y ventanas de toques por tramo que se aceptan como mucho (de sobra para cualquier incursión) */
const MAX_LEGS = 50
const MAX_TURNS = 5000

type Json = Record<string, unknown>

const SPECIES_IDS = new Set(SPECIES.map((sp) => sp.id))
const isObject = (v: unknown): v is Json => typeof v === 'object' && v !== null && !Array.isArray(v)
const isInt = (v: unknown, min: number, max: number): v is number => Number.isInteger(v) && (v as number) >= min && (v as number) <= max
const matches = (v: unknown, re: RegExp): v is string => typeof v === 'string' && re.test(v)
const isIncursion = (v: unknown): v is IncursionId => INCURSIONS.some((i) => i.id === v)

/** El Pokémon con el que se entra: que exista, tenga el nivel de la incursión, conozca el movimiento y no esté debilitado */
function parseMember(incursionId: IncursionId, v: unknown): MemberState | null {
  if (!isObject(v) || !matches(v.id, MON_UID) || !SPECIES_IDS.has(v.speciesId as number) || !matches(v.moveId, MOVE_ID)) return null
  const inc = INCURSIONS.find((i) => i.id === incursionId)!
  if (!isInt(v.level, 1, inc.maxLevel) || !canEnter(inc, v.level) || !isInt(v.stars, 0, MAX_STARS)) return null
  if (typeof v.hpFraction !== 'number' || !(v.hpFraction > 0 && v.hpFraction <= 1)) return null
  const speciesId = v.speciesId as number
  if (!canLearn(speciesId, v.level, v.moveId)) return null
  return { ...freshMember({ id: v.id, speciesId, level: v.level, stars: v.stars, moveId: v.moveId }), hpFraction: v.hpFraction }
}

/** La petición si es válida; null si falta o sobra algo */
export function parseIncursionRequest(body: unknown): IncursionRequest | null {
  if (!isObject(body) || !matches(body.playerId, PLAYER_ID)) return null
  const who = { playerId: body.playerId, nickname: cleanNickname(body.nickname) }
  if (body.action === IncursionAction.Leave) return { action: IncursionAction.Leave, ...who }
  if (body.action === IncursionAction.Queue) {
    if (!isIncursion(body.incursionId)) return null
    const member = parseMember(body.incursionId, body.member)
    return member && { action: IncursionAction.Queue, ...who, incursionId: body.incursionId, member }
  }
  if (!matches(body.groupId, GROUP_ID)) return null
  const group = { ...who, groupId: body.groupId }
  if (body.action === IncursionAction.Sync) return { action: IncursionAction.Sync, ...group }
  if (body.action === IncursionAction.Ready) return { action: IncursionAction.Ready, ...group }
  if (body.action === IncursionAction.Move) return matches(body.moveId, MOVE_ID) ? { action: IncursionAction.Move, ...group, moveId: body.moveId } : null
  if (body.action === IncursionAction.Tap) {
    return isInt(body.leg, 0, MAX_LEGS) && isInt(body.turn, 0, MAX_TURNS) ? { action: IncursionAction.Tap, ...group, leg: body.leg, turn: body.turn } : null
  }
  if (body.action === IncursionAction.Vote) return typeof body.retreat === 'boolean' ? { action: IncursionAction.Vote, ...group, retreat: body.retreat } : null
  return null
}

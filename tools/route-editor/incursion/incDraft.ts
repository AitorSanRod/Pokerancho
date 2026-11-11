// Lo que guarda el formulario de una incursión, con las claves de los diccionarios del juego (`Gyarados`, `Surf`,
// `Battle`…). Los porcentajes se escriben de 0 a 100; el código los pasa a fracción.

import { IncursionPrizeKind, RoomKind, type FoeSlot, type Incursion, type IncursionFoe, type IncursionPrize, type IncursionRoom } from '../../../src/data/incursions'
import { DICTS, keyOf } from '../catalog'
import type { PassiveDraft } from '../draft'
import { loadStored, store } from '../mode'
import { INC_DICTS, MOVE_IDS } from './incCatalog'

export interface BossDraft {
  enrage: { on: boolean; fromTurn: number; every: number; atk: number }
  areaEvery: number | null
  phase: { on: boolean; /** % de PS */ belowHp: number; moves: string[] }
}

export interface FoeDraft {
  species: string
  level: number
  /** Claves de IMOVE */
  moves: string[]
  hpMult: number | null
  passives: PassiveDraft[]
  isBoss: boolean
  boss: BossDraft
}

/** Una plaza de rival: con una opción es fija; con varias, sale una al azar según su peso */
export interface SlotDraft {
  options: { foe: FoeDraft; weight: number }[]
}

export interface RoomDraft {
  kind: string
  name: string
  slots: SlotDraft[]
  reward: { money: number; exp: number }
  /** % de PS que recuperan (Heal) o con el que se levantan (Revive) */
  percent: number
}

export interface PrizeDraft {
  kind: string
  amount: number
  /** % de que salga */
  chance: number
  species: string
  item: string
  tm: string
}

export interface IncursionDraft {
  comment: string
  idKey: string
  /** Valor del IncursionId si es nueva (se guarda en la partida) */
  idValue: string
  name: string
  description: string
  /** Gratuita: sin llave, y lo ganado solo se cobra la primera vez */
  free: boolean
  biome: string
  tier: string
  minLevel: number
  maxLevel: number
  rooms: RoomDraft[]
  prizes: PrizeDraft[]
  bots: string[]
}

const emptyBoss = (): BossDraft => ({ enrage: { on: false, fromTurn: 10, every: 4, atk: 1 }, areaEvery: null, phase: { on: false, belowHp: 30, moves: [''] } })

export const emptyFoe = (): FoeDraft => ({ species: '', level: 10, moves: [''], hpMult: null, passives: [], isBoss: false, boss: emptyBoss() })
export const emptySlot = (): SlotDraft => ({ options: [{ foe: emptyFoe(), weight: 1 }] })
export const emptyRoom = (kind = 'Battle'): RoomDraft => ({ kind, name: '', slots: [emptySlot()], reward: { money: 100, exp: 50 }, percent: 50 })
export const emptyPrize = (): PrizeDraft => ({ kind: 'Money', amount: 1000, chance: 100, species: '', item: 'Stardust', tm: 'Senuelo' })

export const emptyIncursion = (): IncursionDraft => ({
  comment: '',
  idKey: '',
  idValue: '',
  name: '',
  description: '',
  free: false,
  biome: 'Cave',
  tier: 'Easy',
  minLevel: 10,
  maxLevel: 30,
  rooms: [emptyRoom()],
  prizes: [emptyPrize()],
  bots: [''],
})

const pct = (fraction: number) => Math.round(fraction * 10000) / 100
const species = (id: number) => keyOf(DICTS.POKEMON, id)
const moveKeys = (ids: string[]) => ids.map((id) => keyOf(MOVE_IDS, id))

function foeDraft(f: IncursionFoe): FoeDraft {
  const b = f.boss
  const base = emptyBoss()
  return {
    species: species(f.speciesId),
    level: f.level,
    moves: moveKeys(f.moveIds),
    hpMult: f.hpMult ?? null,
    passives: [...(f.passives ?? [])],
    isBoss: !!b,
    boss: {
      enrage: b?.enrage ? { on: true, ...b.enrage } : base.enrage,
      areaEvery: b?.areaEvery ?? null,
      phase: b?.phase ? { on: true, belowHp: pct(b.phase.belowHp), moves: moveKeys(b.phase.moveIds) } : base.phase,
    },
  }
}

const slotDraft = (s: FoeSlot): SlotDraft =>
  'pool' in s ? { options: s.pool.map((o) => ({ foe: foeDraft(o.foe), weight: o.weight })) } : { options: [{ foe: foeDraft(s), weight: 1 }] }

function roomDraft(r: IncursionRoom): RoomDraft {
  const room = { ...emptyRoom(keyOf(INC_DICTS.RoomKind, r.kind)), name: r.name }
  if (r.kind === RoomKind.Battle) return { ...room, slots: r.foes.map(slotDraft), reward: { ...r.reward } }
  if (r.kind === RoomKind.Heal) return { ...room, slots: [], percent: pct(r.heal) }
  if (r.kind === RoomKind.Revive) return { ...room, slots: [], percent: pct(r.hp) }
  return { ...room, slots: [] }
}

function prizeDraft(p: IncursionPrize): PrizeDraft {
  const prize = { ...emptyPrize(), kind: keyOf(INC_DICTS.IncursionPrizeKind, p.kind), amount: p.amount, chance: pct(p.chance) }
  if (p.kind === IncursionPrizeKind.Pieces) prize.species = species(p.speciesId)
  if (p.kind === IncursionPrizeKind.StarItem) prize.item = keyOf(INC_DICTS.StarItem, p.item)
  if (p.kind === IncursionPrizeKind.Tm) prize.tm = keyOf(INC_DICTS.Tm, p.tm)
  return prize
}

export function fromIncursion(inc: Incursion): IncursionDraft {
  return {
    ...emptyIncursion(),
    idKey: keyOf(INC_DICTS.IncursionId, inc.id),
    name: inc.name,
    description: inc.description,
    free: !!inc.free,
    biome: keyOf(DICTS.Biome, inc.biome),
    tier: keyOf(INC_DICTS.IncursionTier, inc.tier),
    minLevel: inc.minLevel,
    maxLevel: inc.maxLevel,
    rooms: inc.rooms.map(roomDraft),
    prizes: inc.prizes.map(prizeDraft),
    bots: inc.bots.map(species),
  }
}

const STORAGE_KEY = 'incursion-editor-draft'

export const loadIncursionDraft = (): IncursionDraft => loadStored(STORAGE_KEY, emptyIncursion)
export const saveIncursionDraft = (d: IncursionDraft) => store(STORAGE_KEY, d)

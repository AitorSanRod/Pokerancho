import { FORM_ITEM_IDS, type FormItem } from '../../data/forms'
import { INCURSIONS, type IncursionId } from '../../data/incursions'
import { RANCH_TYPE_IDS, type RanchTypeId } from '../../data/ranchTypes'
import { STAR_ITEM_IDS, type StarItem } from '../../data/starItems'
import { STONE_IDS, type Stone } from '../../data/stones'
import { TM_IDS, type Tm } from '../../data/tms'
import { starItemsOf } from '../collection/starItems'
import type { GameState } from '../core/state'
import { keysOf } from '../incursion/keys'
import { tmsOf } from '../incursion/tms'
import { hasFormItem } from './forms'
import { MintKind, mintsOf } from './mints'
import { ranchTypeAvailable } from './ranchTypes'
import { stonesOf } from './stones'

export interface BagEntry<Id> {
  id: Id
  count: number
}

/**
 * Lo comprado o ganado y aún sin usar: objetos estelares, objetos evolutivos, mentas y Huevos Suerte sin gastar, objetos de forma (no se gastan),
 * tipos de rancho sin colocar, llaves de incursión y MTs
 */
export interface Bag {
  starItems: BagEntry<StarItem>[]
  stones: BagEntry<Stone>[]
  formItems: BagEntry<FormItem>[]
  /** Mentas aleatorias: solo cuenta cuántas hay */
  mints: number
  /** Mentas neutras: solo cuenta cuántas hay */
  neutralMints: number
  /** Huevos Suerte cogidos en ruta (ver run/expBoost.ts) */
  luckyEggs: number
  ranchTypes: BagEntry<RanchTypeId>[]
  incursionKeys: BagEntry<IncursionId>[]
  tms: BagEntry<Tm>[]
}

const held = <Id>(ids: readonly Id[], countOf: (id: Id) => number): BagEntry<Id>[] =>
  ids.map((id) => ({ id, count: countOf(id) })).filter((entry) => entry.count > 0)

export function bagContents(s: GameState): Bag {
  return {
    starItems: held([...STAR_ITEM_IDS].reverse(), (id) => starItemsOf(s, id)),
    stones: held(STONE_IDS, (id) => stonesOf(s, id)),
    formItems: held(FORM_ITEM_IDS, (id) => (hasFormItem(s, id) ? 1 : 0)),
    mints: mintsOf(s, MintKind.Random),
    neutralMints: mintsOf(s, MintKind.Neutral),
    luckyEggs: s.luckyEggs,
    ranchTypes: held(RANCH_TYPE_IDS, (id) => ranchTypeAvailable(s, id)),
    incursionKeys: held(INCURSIONS.map((i) => i.id), (id) => keysOf(s, id)),
    tms: held(TM_IDS, (id) => tmsOf(s, id)),
  }
}

export const isBagEmpty = (bag: Bag): boolean =>
  Object.values(bag).every((entries) => (typeof entries === 'number' ? entries === 0 : entries.length === 0))

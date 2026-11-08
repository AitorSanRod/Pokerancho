import { INCURSIONS, type IncursionId } from '../../data/incursions'
import { RANCH_TYPE_IDS, type RanchTypeId } from '../../data/ranchTypes'
import { STONE_IDS, type Stone } from '../../data/stones'
import type { GameState } from '../core/state'
import { keysOf } from '../incursion/keys'
import { ranchTypeAvailable } from './ranchTypes'
import { stonesOf } from './stones'

export interface BagEntry<Id> {
  id: Id
  count: number
}

/** Lo comprado en la Tienda y aún sin usar: piedras sin gastar, tipos de rancho sin colocar y llaves de incursión */
export interface Bag {
  stones: BagEntry<Stone>[]
  ranchTypes: BagEntry<RanchTypeId>[]
  incursionKeys: BagEntry<IncursionId>[]
}

const held = <Id>(ids: readonly Id[], countOf: (id: Id) => number): BagEntry<Id>[] =>
  ids.map((id) => ({ id, count: countOf(id) })).filter((entry) => entry.count > 0)

export function bagContents(s: GameState): Bag {
  return {
    stones: held(STONE_IDS, (id) => stonesOf(s, id)),
    ranchTypes: held(RANCH_TYPE_IDS, (id) => ranchTypeAvailable(s, id)),
    incursionKeys: held(INCURSIONS.map((i) => i.id), (id) => keysOf(s, id)),
  }
}

export const isBagEmpty = (bag: Bag): boolean => bag.stones.length === 0 && bag.ranchTypes.length === 0 && bag.incursionKeys.length === 0
